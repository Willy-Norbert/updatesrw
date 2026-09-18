const prisma = require('../config/db');
const { extractMentions } = require('../utils/mentions');
const { notify } = require('./notification.service');

async function syncMentions({ text, author, postId, commentId, contextLabel }) {
  const usernames = extractMentions(text);
  if (!usernames.length) return [];

  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
  });

  const created = [];
  for (const mentioned of users) {
    if (mentioned.id === author.id) continue;
    const mention = await prisma.mention.create({
      data: {
        authorId: author.id,
        mentionedUserId: mentioned.id,
        postId: postId || null,
        commentId: commentId || null,
      },
    });
    await notify({
      recipientId: mentioned.id,
      actorId: author.id,
      type: 'MENTION',
      message: `${author.fullName} mentioned you ${contextLabel}`,
      postId,
      commentId,
    });
    created.push(mention);
  }
  return created;
}

async function replacePostMentions({ text, author, postId }) {
  await prisma.mention.deleteMany({ where: { postId, commentId: null } });
  return syncMentions({
    text,
    author,
    postId,
    contextLabel: 'in a post',
  });
}

module.exports = { syncMentions, replacePostMentions };
