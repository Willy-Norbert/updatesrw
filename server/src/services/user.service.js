const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { publicUser, privateUser } = require('../utils/serializers');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { saveUpload, destroyMedia, removeLocalIfNeeded } = require('./media.service');
const { listInclude, attachViewerState } = require('./post.service');

function shapeProfile(user, extra = {}) {
  return {
    ...publicUser(user),
    email: extra.includeEmail ? user.email : undefined,
    isActive: user.isActive,
    stats: extra.stats || null,
  };
}

async function getByUsername(username, viewer) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      _count: {
        select: { posts: true, comments: true, likes: true, bookmarks: true },
      },
    },
  });
  if (!user || !user.isActive) throw new ApiError(404, 'User not found');

  const [publishedCount, achievementCount, experienceCount] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id, status: 'PUBLISHED' } }),
    prisma.post.count({ where: { authorId: user.id, status: 'PUBLISHED', postType: 'ACHIEVEMENT' } }),
    prisma.post.count({ where: { authorId: user.id, status: 'PUBLISHED', postType: 'EXPERIENCE' } }),
  ]);

  return {
    ...shapeProfile(user, { includeEmail: viewer && viewer.id === user.id }),
    stats: {
      posts: publishedCount,
      achievements: achievementCount,
      experiences: experienceCount,
      likes: user._count.likes,
    },
  };
}

async function updateMe(userId, payload) {
  const data = {};
  if (payload.fullName) data.fullName = payload.fullName;
  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.emailNotifications !== undefined) data.emailNotifications = Boolean(payload.emailNotifications);
  if (payload.username) {
    const username = payload.username.toLowerCase();
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
    });
    if (taken) throw new ApiError(409, 'Username is already taken');
    data.username = username;
  }
  const user = await prisma.user.update({ where: { id: userId }, data });
  return privateUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.password) {
    throw new ApiError(400, 'This account uses Google or GitHub sign-in, so there is no password to change.');
  }
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new ApiError(400, 'Current password is incorrect');
  const password = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password } });
}

async function updateAvatar(userId, file) {
  const saved = await saveUpload(file, 'profiles');
  const current = await prisma.user.findUnique({ where: { id: userId } });
  if (current.profileImage) {
    await destroyMedia(null, 'IMAGE');
    await removeLocalIfNeeded(current.profileImage);
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileImage: saved.url },
  });
  return privateUser(user);
}

async function listUserPosts(username, query, type, viewer) {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user) throw new ApiError(404, 'User not found');
  const { page, limit, skip } = getPagination(query);
  const where = { authorId: user.id, status: 'PUBLISHED' };
  if (type) where.postType = type;
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: listInclude(),
    }),
    prisma.post.count({ where }),
  ]);
  return { items: await attachViewerState(rows, viewer?.id), meta: paginationMeta(page, limit, total) };
}

async function listLikedPosts(username, query, viewer) {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user) throw new ApiError(404, 'User not found');
  const { page, limit, skip } = getPagination(query);
  const where = { userId: user.id, post: { status: 'PUBLISHED' } };
  const [rows, total] = await Promise.all([
    prisma.like.findMany({
      where,
      include: { post: { include: listInclude() } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.like.count({ where }),
  ]);
  const items = await attachViewerState(rows.map((row) => row.post).filter(Boolean), viewer?.id);
  return { items, meta: paginationMeta(page, limit, total) };
}

function postListInclude() {
  return {
    author: true,
    category: true,
    media: { orderBy: { sortOrder: 'asc' } },
    hashtags: { include: { hashtag: true } },
    _count: { select: { likes: true, comments: true, bookmarks: true } },
  };
}

async function mentionSuggestions(q) {
  const term = String(q || '').replace(/^@/, '').trim();
  if (term.length < 1) return [];
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { username: { contains: term.toLowerCase(), mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 8,
    orderBy: { username: 'asc' },
  });
  return users.map(publicUser);
}

module.exports = {
  getByUsername,
  updateMe,
  changePassword,
  updateAvatar,
  listUserPosts,
  listLikedPosts,
  mentionSuggestions,
  postListInclude,
};
