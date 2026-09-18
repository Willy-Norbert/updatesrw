const { Role } = require('@prisma/client');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { privateUser } = require('../utils/serializers');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { notify } = require('./notification.service');

async function stats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    activeUsers,
    totalPosts,
    publishedPosts,
    totalComments,
    totalLikes,
    totalVideos,
    totalReports,
    pendingReports,
    featuredPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { isActive: true, lastLoginAt: { gte: since } },
    }),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.postMedia.count({ where: { type: 'VIDEO' } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { featured: true } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalPosts,
    publishedPosts,
    totalComments,
    totalLikes,
    totalVideos,
    totalReports,
    pendingReports,
    featuredPosts,
  };
}

async function listUsers(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.q) {
    where.OR = [
      { username: { contains: query.q, mode: 'insensitive' } },
      { fullName: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { _count: { select: { posts: true, comments: true, likes: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: rows.map((user) => ({ ...privateUser(user), _count: user._count })),
    meta: paginationMeta(page, limit, total),
  };
}

async function changeRole(id, role, actor) {
  if (!Object.values(Role).includes(role)) throw new ApiError(400, 'Invalid role');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.id === actor.id) throw new ApiError(400, 'You cannot change your own role');
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  await notify({
    recipientId: id,
    actorId: actor.id,
    type: 'MODERATION',
    message: `Your role was updated to ${role.replace('_', ' ').toLowerCase()}`,
  });
  return privateUser(updated);
}

async function setActive(id, isActive, actor) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.id === actor.id) throw new ApiError(400, 'You cannot deactivate your own account');
  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  if (!isActive) {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }
  await notify({
    recipientId: id,
    actorId: actor.id,
    type: 'MODERATION',
    message: isActive ? 'Your account was restored' : 'Your account was deactivated',
  });
  return privateUser(updated);
}

async function listAllPosts(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.featured === 'true' || query.featured === true) where.featured = true;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { plainText: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: true,
        category: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
  return { items: rows, meta: paginationMeta(page, limit, total) };
}

async function listAllComments(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.q) where.content = { contains: query.q, mode: 'insensitive' };
  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        author: true,
        post: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);
  return { items: rows, meta: paginationMeta(page, limit, total) };
}

async function listHashtags(query) {
  const { page, limit, skip } = getPagination(query);
  const where = query.q
    ? { name: { contains: String(query.q).toLowerCase(), mode: 'insensitive' } }
    : {};
  const [rows, total] = await Promise.all([
    prisma.hashtag.findMany({
      where,
      include: { _count: { select: { posts: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.hashtag.count({ where }),
  ]);
  return { items: rows, meta: paginationMeta(page, limit, total) };
}

async function deleteHashtag(id) {
  const tag = await prisma.hashtag.findUnique({ where: { id } });
  if (!tag) throw new ApiError(404, 'Hashtag not found');
  await prisma.hashtag.delete({ where: { id } });
}

module.exports = {
  stats,
  listUsers,
  changeRole,
  setActive,
  listAllPosts,
  listAllComments,
  listHashtags,
  deleteHashtag,
};
