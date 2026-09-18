const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { publicUser } = require('../utils/serializers');
const { canDeleteComment, canModerate } = require('../utils/permissions');
const { notify } = require('./notification.service');
const { syncMentions } = require('./mention.service');
const { sendCommentEmail } = require('./mail.service');

function shapeComment(comment, extras = {}) {
  return {
    id: comment.id,
    content: comment.content,
    parentCommentId: comment.parentCommentId,
    isHidden: comment.isHidden,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: publicUser(comment.author),
    replies: extras.replies || [],
  };
}

function nestComments(rows) {
  const map = new Map();
  rows.forEach((row) => map.set(row.id, shapeComment(row, { replies: [] })));
  const roots = [];
  for (const row of rows) {
    const node = map.get(row.id);
    if (row.parentCommentId && map.has(row.parentCommentId)) {
      map.get(row.parentCommentId).replies.push(node);
    } else if (!row.parentCommentId) roots.push(node);
  }
  return roots;
}

async function listByPost(postId, user) {
  const where = { postId };
  if (!canModerate(user)) where.isHidden = false;
  const rows = await prisma.comment.findMany({
    where,
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
  return nestComments(rows);
}

async function create(postId, user, payload) {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
  if (!post || post.status === 'HIDDEN') throw new ApiError(404, 'Post not found');
  let parent = null;
  if (payload.parentCommentId) {
    parent = await prisma.comment.findFirst({
      where: { id: payload.parentCommentId, postId },
      include: { author: true },
    });
    if (!parent) throw new ApiError(400, 'Parent comment not found');
  }
  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: user.id,
      parentCommentId: payload.parentCommentId || null,
      content: payload.content.trim(),
    },
    include: { author: true },
  });
  try {
    await syncMentions({
      text: comment.content,
      author: user,
      postId,
      commentId: comment.id,
      contextLabel: 'in a comment',
    });
    if (parent) {
      await notify({
        recipientId: parent.authorId,
        actorId: user.id,
        type: 'REPLY',
        message: `${user.fullName} replied to your comment`,
        postId,
        commentId: comment.id,
      });
      sendCommentEmail({ recipient: parent.author, actor: user, post, comment, isReply: true }).catch(() => {});
    } else {
      await notify({
        recipientId: post.authorId,
        actorId: user.id,
        type: 'COMMENT',
        message: `${user.fullName} commented on your post`,
        postId,
        commentId: comment.id,
      });
      sendCommentEmail({ recipient: post.author, actor: user, post, comment, isReply: false }).catch(() => {});
    }
  } catch (error) {
    console.error('Comment side effects failed', error);
  }
  return shapeComment(comment);
}

async function update(id, user, payload) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.authorId !== user.id) throw new ApiError(403, 'You are not authorized to perform this action');
  const updated = await prisma.comment.update({
    where: { id },
    data: { content: payload.content.trim() },
    include: { author: true },
  });
  return shapeComment(updated);
}

async function remove(id, user) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (!canDeleteComment(user, comment)) throw new ApiError(403, 'You are not authorized to perform this action');
  await prisma.comment.delete({ where: { id } });
}

async function hide(id, hidden) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new ApiError(404, 'Comment not found');
  return prisma.comment.update({
    where: { id },
    data: { isHidden: Boolean(hidden) },
    include: { author: true },
  });
}

module.exports = { listByPost, create, update, remove, hide };
