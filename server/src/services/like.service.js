const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { notify } = require('./notification.service');
const { sendLikeEmail } = require('./mail.service');

async function like(postId, user) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });
  if (!post || post.status === 'HIDDEN') throw new ApiError(404, 'Post not found');

  try {
    await prisma.like.create({ data: { postId, userId: user.id } });
  } catch (error) {
    if (error.code === 'P2002') {
      return { liked: true, likesCount: await prisma.like.count({ where: { postId } }) };
    }
    throw error;
  }

  try {
    await notify({
      recipientId: post.authorId,
      actorId: user.id,
      type: 'LIKE',
      message: `${user.fullName} liked your post`,
      postId,
    });
    sendLikeEmail({ recipient: post.author, actor: user, post }).catch((error) => {
      console.error('Like email failed', error);
    });
  } catch (error) {
    console.error('Like notification failed', error);
  }

  return { liked: true, likesCount: await prisma.like.count({ where: { postId } }) };
}

async function unlike(postId, user) {
  await prisma.like.deleteMany({ where: { postId, userId: user.id } });
  return { liked: false, likesCount: await prisma.like.count({ where: { postId } }) };
}

async function adminRemoveLike(postId, userId) {
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existing) throw new ApiError(404, 'Like not found');
  await prisma.like.delete({ where: { id: existing.id } });
  return { liked: false, likesCount: await prisma.like.count({ where: { postId } }) };
}

async function listLikes(postId) {
  return prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: { id: true, username: true, fullName: true, profileImage: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { like, unlike, adminRemoveLike, listLikes };
