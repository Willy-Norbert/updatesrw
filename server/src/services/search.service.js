const prisma = require('../config/db');
const { publicUser } = require('../utils/serializers');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { listInclude, attachViewerState } = require('./post.service');

async function search({ q, type = 'all' }, user) {
  const term = String(q || '').trim();
  if (term.length < 2) {
    return { posts: [], users: [], hashtags: [], categories: [] };
  }
  const { page, limit, skip } = getPagination({ page: 1, limit: 10 });

  const runPosts = type === 'all' || type === 'posts';
  const runUsers = type === 'all' || type === 'users';
  const runHashtags = type === 'all' || type === 'hashtags';
  const runCategories = type === 'all' || type === 'categories';

  const [posts, postTotal, users, hashtags, categories] = await Promise.all([
    runPosts
      ? prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { plainText: { contains: term, mode: 'insensitive' } },
              { hashtags: { some: { hashtag: { name: { contains: term.toLowerCase(), mode: 'insensitive' } } } } },
            ],
          },
          include: listInclude(),
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        })
      : [],
    runPosts
      ? prisma.post.count({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { plainText: { contains: term, mode: 'insensitive' } },
            ],
          },
        })
      : 0,
    runUsers
      ? prisma.user.findMany({
          where: {
            isActive: true,
            OR: [
              { username: { contains: term.toLowerCase(), mode: 'insensitive' } },
              { fullName: { contains: term, mode: 'insensitive' } },
            ],
          },
          take: 10,
        })
      : [],
    runHashtags
      ? prisma.hashtag.findMany({
          where: { name: { contains: term.replace(/^#/, '').toLowerCase(), mode: 'insensitive' } },
          include: { _count: { select: { posts: true } } },
          take: 10,
        })
      : [],
    runCategories
      ? prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { slug: { contains: term.toLowerCase(), mode: 'insensitive' } },
            ],
          },
          take: 10,
        })
      : [],
  ]);

  return {
    posts: await attachViewerState(posts, user?.id),
    users: users.map(publicUser),
    hashtags,
    categories,
    meta: paginationMeta(page, limit, postTotal),
  };
}

module.exports = { search };
