const { z } = require('zod');

const mediaItem = z.object({
  url: z.string().min(1),
  type: z.enum(['IMAGE', 'VIDEO']),
  publicId: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.coerce.number().int().optional().nullable(),
});

const postBody = z.object({
  title: z.string().trim().min(3).max(180),
  content: z.string().min(1).max(50000),
  postType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'EXPERIENCE', 'ACHIEVEMENT', 'ARTICLE']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
  categoryId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().transform((value) => value || null),
  hashtags: z.array(z.string()).optional(),
  media: z.array(mediaItem).optional(),
  achievementDate: z.union([z.string().min(4), z.literal(''), z.null()]).optional().transform((value) => value || null),
  organization: z.union([z.string().trim().max(120), z.literal(''), z.null()]).optional().transform((value) => value || null),
  lessonsLearned: z.union([z.string().trim().max(5000), z.literal(''), z.null()]).optional().transform((value) => value || null),
});

const postQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  category: z.string().trim().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'EXPERIENCE', 'ACHIEVEMENT', 'ARTICLE']).optional(),
  sort: z.enum(['latest', 'trending', 'featured']).optional(),
  author: z.string().trim().optional(),
  q: z.string().trim().optional(),
});

module.exports = { postBody, postQuery, mediaItem };
