const prisma = require('../config/db');
const { mergeHashtags, normalizeHashtag } = require('../utils/hashtags');

async function syncPostHashtags(postId, content, explicit = []) {
  const names = mergeHashtags(content, explicit);
  await prisma.postHashtag.deleteMany({ where: { postId } });
  if (!names.length) return [];

  const tags = [];
  for (const name of names) {
    const hashtag = await prisma.hashtag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
    tags.push(hashtag);
  }
  return tags;
}

async function trending(limit = 12) {
  const groups = await prisma.postHashtag.groupBy({
    by: ['hashtagId'],
    _count: { hashtagId: true },
    orderBy: { _count: { hashtagId: 'desc' } },
    take: limit,
  });
  if (!groups.length) {
    return prisma.hashtag.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
  const ids = groups.map((item) => item.hashtagId);
  const tags = await prisma.hashtag.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(tags.map((tag) => [tag.id, tag]));
  return groups.map((item) => ({
    ...byId[item.hashtagId],
    postCount: item._count.hashtagId,
  }));
}

async function recent(limit = 12) {
  return prisma.hashtag.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { _count: { select: { posts: true } } },
  });
}

async function search(q, limit = 20) {
  const name = normalizeHashtag(q);
  if (!name) return [];
  return prisma.hashtag.findMany({
    where: { name: { contains: name, mode: 'insensitive' } },
    include: { _count: { select: { posts: true } } },
    take: limit,
  });
}

async function getByName(name) {
  return prisma.hashtag.findUnique({
    where: { name: normalizeHashtag(name) },
    include: { _count: { select: { posts: true } } },
  });
}

module.exports = { syncPostHashtags, trending, recent, search, getByName };
