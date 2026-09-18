const prisma = require('../config/db');
const { publicUser } = require('../utils/serializers');

async function notify({ recipientId, actorId, type, message, postId, commentId }) {
  if (!recipientId || recipientId === actorId) return null;
  try {
    return await prisma.notification.create({
      data: { recipientId, actorId, type, message, postId, commentId },
    });
  } catch (error) {
    console.error('Failed to create notification', error);
    return null;
  }
}

async function listForUser(userId, { skip, limit }) {
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        actor: true,
        post: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      message: item.message,
      isRead: item.isRead,
      createdAt: item.createdAt,
      post: item.post,
      actor: publicUser(item.actor),
    })),
    total,
    unreadCount,
  };
}

async function markRead(userId, id) {
  const notification = await prisma.notification.findFirst({
    where: { id, recipientId: userId },
  });
  if (!notification) return null;
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

async function markAllRead(userId) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { notify, listForUser, markRead, markAllRead };
