const { z } = require('zod');

const commentBody = z.object({
  content: z
    .string({ error: 'Comment is required' })
    .trim()
    .min(1, { error: 'Comment cannot be empty' })
    .max(4000, { error: 'Comment is too long' }),
  parentCommentId: z.string().uuid({ error: 'Invalid comment' }).optional().nullable(),
});

const commentUpdateBody = z.object({
  content: z
    .string({ error: 'Comment is required' })
    .trim()
    .min(1, { error: 'Comment cannot be empty' })
    .max(4000, { error: 'Comment is too long' }),
});

module.exports = { commentBody, commentUpdateBody };
