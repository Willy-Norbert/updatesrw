const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { publicUser } = require('../utils/serializers');
const { getPagination, paginationMeta } = require('../utils/pagination');

async function create(user, payload) {
  if (payload.targetType === 'POST') {
    const post = await prisma.post.findUnique({ where: { id: payload.postId } });
    if (!post) throw new ApiError(404, 'Post not found');
    const existing = await prisma.report.findFirst({
      where: { reporterId: user.id, postId: payload.postId, status: 'PENDING' },
    });
    if (existing) throw new ApiError(409, 'You already reported this post');
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: payload.commentId } });
    if (!comment) throw new ApiError(404, 'Comment not found');
    const existing = await prisma.report.findFirst({
      where: { reporterId: user.id, commentId: payload.commentId, status: 'PENDING' },
    });
    if (existing) throw new ApiError(409, 'You already reported this comment');
  }

  return prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: payload.targetType,
      postId: payload.postId || null,
      commentId: payload.commentId || null,
      reason: payload.reason.trim(),
    },
  });
}

function shape(report) {
  return {
    id: report.id,
    targetType: report.targetType,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: publicUser(report.reporter),
    reviewer: publicUser(report.reviewer),
    post: report.post
      ? { id: report.post.id, title: report.post.title, status: report.post.status }
      : null,
    comment: report.comment
      ? { id: report.comment.id, content: report.comment.content, isHidden: report.comment.isHidden }
      : null,
  };
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.targetType) where.targetType = query.targetType;
  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: true,
        reviewer: true,
        post: true,
        comment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.report.count({ where }),
  ]);
  return { items: rows.map(shape), meta: paginationMeta(page, limit, total) };
}

async function updateStatus(id, status, reviewerId) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new ApiError(404, 'Report not found');
  const updated = await prisma.report.update({
    where: { id },
    data: { status, reviewedBy: reviewerId },
    include: { reporter: true, reviewer: true, post: true, comment: true },
  });
  return shape(updated);
}

module.exports = { create, list, updateStatus };
