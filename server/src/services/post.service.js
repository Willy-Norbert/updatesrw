const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { publicUser } = require('../utils/serializers');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { sanitizeContent, htmlToText, makeExcerpt } = require('../utils/sanitize');
const { canEditPost, canDeletePost, canViewPost, canModerate } = require('../utils/permissions');
const { syncPostHashtags } = require('./hashtag.service');
const { replacePostMentions, syncMentions } = require('./mention.service');
const { notify } = require('./notification.service');
const { destroyMedia, removeLocalIfNeeded } = require('./media.service');

const authorSelect = {
  id: true,
  username: true,
  fullName: true,
  profileImage: true,
  role: true,
  bio: true,
  createdAt: true,
};

function shapePost(post, extras = {}) {
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    postType: post.postType,
    status: post.status,
    featured: post.featured,
    lessonsLearned: post.lessonsLearned,
    achievementDate: post.achievementDate,
    organization: post.organization,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: publicUser(post.author),
    category: post.category,
    media: post.media || [],
    hashtags: (post.hashtags || []).map((item) => item.hashtag || item),
    likesCount: post._count?.likes ?? post.likesCount ?? 0,
    commentsCount: post._count?.comments ?? post.commentsCount ?? 0,
    bookmarksCount: post._count?.bookmarks ?? 0,
    likedByMe: extras.likedByMe ?? false,
    bookmarkedByMe: extras.bookmarkedByMe ?? false,
  };
}

function listInclude() {
  return {
    author: { select: authorSelect },
    category: true,
    media: { orderBy: { sortOrder: 'asc' } },
    hashtags: { include: { hashtag: true } },
    _count: { select: { likes: true, comments: { where: { isHidden: false } }, bookmarks: true } },
  };
}

function inferPostType(payload, media = []) {
  if (payload.postType) return payload.postType;
  if (payload.achievementDate || payload.organization) return 'ACHIEVEMENT';
  if (payload.lessonsLearned) return 'EXPERIENCE';
  const hasVideo = media.some((item) => item.type === 'VIDEO');
  const hasImage = media.some((item) => item.type === 'IMAGE');
  if (hasVideo) return 'VIDEO';
  if (hasImage) return 'IMAGE';
  return 'TEXT';
}

async function attachViewerState(posts, userId) {
  if (!userId || !posts.length) {
    return posts.map((post) => shapePost(post));
  }
  const ids = posts.map((post) => post.id);
  const [likes, bookmarks] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }),
    prisma.bookmark.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }),
  ]);
  const liked = new Set(likes.map((item) => item.postId));
  const bookmarked = new Set(bookmarks.map((item) => item.postId));
  return posts.map((post) =>
    shapePost(post, {
      likedByMe: liked.has(post.id),
      bookmarkedByMe: bookmarked.has(post.id),
    })
  );
}

function visibilityWhere(user) {
  if (!user) return { status: 'PUBLISHED' };
  if (canModerate(user)) return {};
  return {
    OR: [{ status: 'PUBLISHED' }, { authorId: user.id }],
  };
}

async function list(query, user) {
  const { page, limit, skip } = getPagination(query);
  const where = visibilityWhere(user);
  if (!canModerate(user)) {
    where.status = where.status || 'PUBLISHED';
    if (where.OR) {
      // keep drafts of owner plus published
    } else {
      where.status = 'PUBLISHED';
    }
  } else {
    where.status = { in: ['PUBLISHED', 'HIDDEN', 'DRAFT'] };
    if (query.status) where.status = query.status;
  }

  if (!user || !canModerate(user)) {
    Object.assign(where, {
      AND: [
        {
          OR: [{ status: 'PUBLISHED' }, ...(user ? [{ authorId: user.id }] : [])],
        },
      ],
    });
    delete where.status;
    delete where.OR;
  }

  if (query.type) where.postType = query.type;
  if (query.category) {
    where.category = {
      OR: [{ slug: query.category }, { id: query.category }],
    };
  }
  if (query.author) {
    where.author = { username: query.author.toLowerCase() };
  }
  if (query.q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { plainText: { contains: query.q, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const sort = query.sort || 'latest';
  let orderBy = { createdAt: 'desc' };
  if (sort === 'featured') {
    where.featured = true;
    if (!canModerate(user)) {
      where.AND = [
        ...(where.AND || []),
        { status: 'PUBLISHED' },
      ];
    }
  }

  const findArgs = {
    where,
    include: listInclude(),
    skip,
    take: limit,
  };

  if (sort === 'trending') {
    findArgs.orderBy = [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }];
  } else {
    findArgs.orderBy = orderBy;
  }

  const [rows, total] = await Promise.all([
    prisma.post.findMany(findArgs),
    prisma.post.count({ where }),
  ]);

  return {
    items: await attachViewerState(rows, user?.id),
    meta: paginationMeta(page, limit, total),
  };
}

async function getById(id, user) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      ...listInclude(),
      mentions: { include: { mentionedUser: true } },
    },
  });
  if (!post || !canViewPost(user, post)) throw new ApiError(404, 'Post not found');

  if (!user || user.id !== post.authorId) {
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    post.viewCount += 1;
  }

  const [shaped] = await attachViewerState([post], user?.id);
  return {
    ...shaped,
    mentions: (post.mentions || []).map((item) => ({
      id: item.id,
      user: publicUser(item.mentionedUser),
    })),
  };
}

async function create(user, payload) {
  const content = sanitizeContent(payload.content);
  const plainText = htmlToText(content);
  if (!plainText && !(payload.media || []).length) {
    throw new ApiError(400, 'Post content cannot be empty');
  }
  const media = payload.media || [];
  const postType = inferPostType(payload, media);
  const status = payload.status || 'PUBLISHED';

  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      title: payload.title.trim(),
      content,
      plainText,
      excerpt: makeExcerpt(plainText),
      postType,
      status,
      categoryId: payload.categoryId || null,
      lessonsLearned: payload.lessonsLearned || null,
      achievementDate: payload.achievementDate ? new Date(payload.achievementDate) : null,
      organization: payload.organization || null,
      media: media.length
        ? {
            create: media.map((item, index) => ({
              type: item.type,
              url: item.url,
              publicId: item.publicId || null,
              mimeType: item.mimeType || null,
              size: item.size || null,
              sortOrder: index,
            })),
          }
        : undefined,
    },
    include: listInclude(),
  });

  const tagSource = `${plainText} ${(payload.hashtags || []).map((tag) => `#${tag}`).join(' ')}`;
  await syncPostHashtags(post.id, tagSource, payload.hashtags || []);
  await replacePostMentions({
    text: `${payload.title} ${plainText}`,
    author: user,
    postId: post.id,
  });

  const full = await prisma.post.findUnique({ where: { id: post.id }, include: listInclude() });
  const [shaped] = await attachViewerState([full], user.id);

  if (shaped.status === 'PUBLISHED') {
    const { sendNewPostEmails } = require('./mail.service');
    sendNewPostEmails(shaped, user).catch((error) => console.error('New post emails failed', error));
  }

  return shaped;
}

async function update(id, user, payload) {
  const existing = await prisma.post.findUnique({ where: { id }, include: { media: true } });
  if (!existing) throw new ApiError(404, 'Post not found');
  if (!canEditPost(user, existing)) {
    throw new ApiError(403, 'You are not authorized to perform this action');
  }

  const content = payload.content !== undefined ? sanitizeContent(payload.content) : existing.content;
  const plainText = htmlToText(content);
  const data = {
    title: payload.title?.trim() ?? existing.title,
    content,
    plainText,
    excerpt: makeExcerpt(plainText),
    categoryId: payload.categoryId === undefined ? existing.categoryId : payload.categoryId,
    lessonsLearned: payload.lessonsLearned === undefined ? existing.lessonsLearned : payload.lessonsLearned,
    organization: payload.organization === undefined ? existing.organization : payload.organization,
    achievementDate:
      payload.achievementDate === undefined
        ? existing.achievementDate
        : payload.achievementDate
          ? new Date(payload.achievementDate)
          : null,
  };
  if (payload.status) data.status = payload.status;
  if (payload.postType) data.postType = payload.postType;
  if (payload.media) {
    data.postType = inferPostType({ ...existing, ...payload }, payload.media);
  }

  await prisma.post.update({ where: { id }, data });

  if (payload.media) {
    const keepUrls = new Set(payload.media.map((item) => item.url));
    for (const item of existing.media) {
      if (!keepUrls.has(item.url)) {
        await destroyMedia(item.publicId, item.type);
        await removeLocalIfNeeded(item.url);
      }
    }
    await prisma.postMedia.deleteMany({ where: { postId: id } });
    if (payload.media.length) {
      await prisma.postMedia.createMany({
        data: payload.media.map((item, index) => ({
          postId: id,
          type: item.type,
          url: item.url,
          publicId: item.publicId || null,
          mimeType: item.mimeType || null,
          size: item.size || null,
          sortOrder: index,
        })),
      });
    }
  }

  if (payload.content !== undefined || payload.hashtags || payload.title) {
    const tagSource = `${plainText} ${(payload.hashtags || []).map((tag) => `#${tag}`).join(' ')}`;
    await syncPostHashtags(id, tagSource, payload.hashtags || []);
    await replacePostMentions({
      text: `${data.title} ${plainText}`,
      author: user,
      postId: id,
    });
  }

  const full = await prisma.post.findUnique({ where: { id }, include: listInclude() });
  const [shaped] = await attachViewerState([full], user.id);

  const justPublished = existing.status !== 'PUBLISHED' && shaped.status === 'PUBLISHED';
  if (justPublished) {
    const { sendNewPostEmails } = require('./mail.service');
    sendNewPostEmails(shaped, user).catch((error) => console.error('New post emails failed', error));
  }

  return shaped;
}

async function remove(id, user) {
  const existing = await prisma.post.findUnique({ where: { id }, include: { media: true } });
  if (!existing) throw new ApiError(404, 'Post not found');
  if (!canDeletePost(user, existing)) {
    throw new ApiError(403, 'You are not authorized to perform this action');
  }
  for (const item of existing.media) {
    await destroyMedia(item.publicId, item.type);
    await removeLocalIfNeeded(item.url);
  }
  await prisma.post.delete({ where: { id } });
}

async function setFeatured(id, featured, actor) {
  const post = await prisma.post.findUnique({ where: { id }, include: { author: true } });
  if (!post) throw new ApiError(404, 'Post not found');
  const updated = await prisma.post.update({
    where: { id },
    data: { featured: Boolean(featured) },
    include: listInclude(),
  });
  if (featured) {
    await notify({
      recipientId: post.authorId,
      actorId: actor.id,
      type: 'FEATURED',
      message: 'Your post was featured by an editor',
      postId: id,
    });
  }
  const [shaped] = await attachViewerState([updated], actor.id);
  return shaped;
}

async function setHidden(id, hidden, actor) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError(404, 'Post not found');
  const updated = await prisma.post.update({
    where: { id },
    data: { status: hidden ? 'HIDDEN' : 'PUBLISHED' },
    include: listInclude(),
  });
  await notify({
    recipientId: post.authorId,
    actorId: actor.id,
    type: 'MODERATION',
    message: hidden ? 'Your post was hidden by a moderator' : 'Your post was restored by a moderator',
    postId: id,
  });
  const [shaped] = await attachViewerState([updated], actor.id);
  return shaped;
}

async function listByHashtag(name, query, user) {
  const { page, limit, skip } = getPagination(query);
  const hashtag = await prisma.hashtag.findUnique({ where: { name: name.toLowerCase() } });
  if (!hashtag) throw new ApiError(404, 'Hashtag not found');
  const where = {
    status: 'PUBLISHED',
    hashtags: { some: { hashtagId: hashtag.id } },
  };
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: listInclude(),
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
  return {
    hashtag,
    items: await attachViewerState(rows, user?.id),
    meta: paginationMeta(page, limit, total),
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setFeatured,
  setHidden,
  listByHashtag,
  shapePost,
  listInclude,
  attachViewerState,
  syncMentions,
};
