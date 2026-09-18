const { z } = require('zod');
const { password } = require('./auth.validator');

const updateProfileBody = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  emailNotifications: z.boolean().optional(),
});

const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

module.exports = { updateProfileBody, changePasswordBody };
