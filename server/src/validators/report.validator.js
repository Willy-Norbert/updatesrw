const { z } = require('zod');

const reportBody = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  reason: z.string().trim().min(8).max(1000),
}).refine((data) => {
  if (data.targetType === 'POST') return Boolean(data.postId);
  if (data.targetType === 'COMMENT') return Boolean(data.commentId);
  return false;
}, { message: 'A matching target id is required' });

const reportStatusBody = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED']),
});

module.exports = { reportBody, reportStatusBody };
