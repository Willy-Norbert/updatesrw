const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { listInclude, attachViewerState } = require('./post.service');

async function add(postId, user) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.status !== 'PUBLISHED') throw new ApiError(404, 'Post not found');
  try {
    await prisma.bookmark.create({ data: { postId, userId: user.id } });
  } catch (error) {
    if (error.code !== 'P2002') throw error;
  }
  return { bookmarked: true };
}

async function remove(postId, user) {
  await prisma.bookmark.deleteMany({ where: { postId, userId: user.id } });
  return { bookmarked: false };
}

async function list(user, query) {
  const { page, limit, skip } = getPagination(query);
  const where = { userId: user.id, post: { status: 'PUBLISHED' } };
  const [rows, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: { post: { include: listInclude() } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookmark.count({ where }),
  ]);
  const posts = await attachViewerState(
    rows.map((row) => row.post).filter(Boolean),
    user.id
  );
  return { items: posts, meta: paginationMeta(page, limit, total) };
}

module.exports = { add, remove, list };
