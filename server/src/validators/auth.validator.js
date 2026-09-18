const { z } = require('zod');

const username = z
  .string()
  .trim()
  .min(3, { error: 'Username must be at least 3 characters' })
  .max(30, { error: 'Username must be at most 30 characters' })
  .regex(/^[a-zA-Z0-9_]+$/, {
    error: 'Username can only contain letters, numbers, and underscores',
  });

const password = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(72, { error: 'Password is too long' })
  .regex(/[A-Za-z]/, { error: 'Password must include a letter' })
  .regex(/[0-9]/, { error: 'Password must include a number' });

const registerBody = z.object({
  username,
  fullName: z
    .string()
    .trim()
    .min(2, { error: 'Full name must be at least 2 characters' })
    .max(80, { error: 'Full name is too long' }),
  email: z
    .string()
    .trim()
    .email({ error: 'Enter a valid email address' })
    .max(120, { error: 'Email is too long' }),
  password,
});

const loginBody = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, { error: 'Email or username is required' })
    .max(120, { error: 'Email or username is too long' }),
  password: z.string().min(1, { error: 'Password is required' }),
});

const otpBody = z.object({
  code: z.string().trim().regex(/^\d{6}$/, { error: 'Enter the 6-digit code' }),
});

const forgotBody = z.object({
  email: z.string().trim().email({ error: 'Enter a valid email address' }),
});

const resetBody = z.object({
  email: z.string().trim().email({ error: 'Enter a valid email address' }),
  code: z.string().trim().regex(/^\d{6}$/, { error: 'Enter the 6-digit code' }),
  password,
});

const onboardingBody = z.object({
  bio: z.string().trim().max(500).optional().nullable(),
  fullName: z.string().trim().min(2).max(80).optional(),
  emailNotifications: z.boolean().optional(),
});

module.exports = {
  registerBody,
  loginBody,
  username,
  password,
  otpBody,
  forgotBody,
  resetBody,
  onboardingBody,
};
