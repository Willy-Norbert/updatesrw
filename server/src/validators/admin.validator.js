const { z } = require('zod');

const categoryBody = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).optional().nullable(),
});

const roleBody = z.object({
  role: z.enum(['USER', 'CHIEF_EDITOR', 'ADMIN']),
});

const activeBody = z.object({
  isActive: z.boolean(),
});

const featuredBody = z.object({
  featured: z.boolean(),
});

const hideBody = z.object({
  hidden: z.boolean(),
});

module.exports = { categoryBody, roleBody, activeBody, featuredBody, hideBody };
