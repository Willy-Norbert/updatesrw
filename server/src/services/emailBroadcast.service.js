const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { buildCustomEmail, escapeHtml } = require('./mail.service');
const { sendBulkMail } = require('./mail.transport');
const { publicUser } = require('../utils/serializers');

function normalizeEmails(list = []) {
  return [...new Set(
    list
      .map((item) => String(item || '').trim().toLowerCase())
      .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item))
  )];
}

async function resolveRecipients({ audience = 'ALL_USERS', userIds = [], externalEmails = [] }) {
  const external = normalizeEmails(externalEmails);
  let users = [];

  if (audience === 'ALL_USERS') {
    users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, fullName: true, username: true, profileImage: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  } else if (audience === 'SELECTED_USERS' || audience === 'MIXED') {
    users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds }, isActive: true },
          select: { id: true, email: true, fullName: true, username: true, profileImage: true, role: true },
        })
      : [];
  }

  const emails = normalizeEmails([
    ...users.map((user) => user.email),
    ...(audience === 'EXTERNAL' || audience === 'MIXED' || audience === 'ALL_USERS' ? external : []),
  ]);

  let resolvedAudience = audience;
  if (audience === 'ALL_USERS' && external.length) resolvedAudience = 'MIXED';
  if (audience === 'MIXED' && !users.length && external.length) resolvedAudience = 'EXTERNAL';
  if (audience === 'MIXED' && users.length && !external.length) resolvedAudience = 'SELECTED_USERS';

  return { users, emails, audience: resolvedAudience };
}

function previewPayload({ subject, message, ctaLabel, ctaUrl }) {
  if (!subject?.trim()) throw new ApiError(400, 'Subject is required');
  if (!message?.trim()) throw new ApiError(400, 'Message is required');
  const bodyHtml = `<div>${escapeHtml(message).replace(/\n/g, '<br>')}</div>`;
  return buildCustomEmail({
    subject: subject.trim(),
    bodyHtml,
    ctaLabel: ctaLabel?.trim() || null,
    ctaUrl: ctaUrl?.trim() || null,
  });
}

async function previewEmail(payload) {
  const resolved = await resolveRecipients(payload);
  const email = previewPayload(payload);
  const log = await prisma.emailLog.create({
    data: {
      senderId: payload.senderId || null,
      subject: email.subject,
      htmlBody: email.html,
      textBody: payload.message,
      audience: resolved.audience,
      recipientCount: resolved.emails.length,
      recipients: resolved.emails.slice(0, 100),
      previewOnly: true,
      status: 'PREVIEW',
    },
  });
  return {
    id: log.id,
    subject: email.subject,
    html: email.html,
    recipientCount: resolved.emails.length,
    recipients: resolved.emails.slice(0, 20),
    users: resolved.users.slice(0, 20).map(publicUser),
    audience: resolved.audience,
  };
}

async function sendEmail(payload) {
  const resolved = await resolveRecipients(payload);
  if (!resolved.emails.length) throw new ApiError(400, 'Add at least one recipient');
  const email = previewPayload(payload);
  const results = await sendBulkMail({
    recipients: resolved.emails,
    subject: email.subject,
    html: email.html,
    text: payload.message,
  });
  const failed = results.filter((item) => !item.ok).length;
  const log = await prisma.emailLog.create({
    data: {
      senderId: payload.senderId || null,
      subject: email.subject,
      htmlBody: email.html,
      textBody: payload.message,
      audience: resolved.audience,
      recipientCount: resolved.emails.length,
      recipients: { emails: resolved.emails.slice(0, 200), failed },
      previewOnly: false,
      status: failed ? 'PARTIAL' : 'SENT',
    },
  });
  return {
    id: log.id,
    subject: email.subject,
    recipientCount: resolved.emails.length,
    sent: results.filter((item) => item.ok).length,
    failed,
    previewUrls: results.map((item) => item.previewUrl).filter(Boolean).slice(0, 5),
  };
}

async function listEmails() {
  const rows = await prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: { sender: true },
  });
  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    audience: row.audience,
    recipientCount: row.recipientCount,
    previewOnly: row.previewOnly,
    status: row.status,
    createdAt: row.createdAt,
    sender: publicUser(row.sender),
    html: row.htmlBody,
    htmlBody: row.htmlBody,
  }));
}

async function listRecipientOptions(q = '') {
  const term = String(q || '').trim();
  return prisma.user.findMany({
    where: {
      isActive: true,
      ...(term
        ? {
            OR: [
              { username: { contains: term.toLowerCase(), mode: 'insensitive' } },
              { fullName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term.toLowerCase(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { fullName: 'asc' },
    take: 40,
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      profileImage: true,
      role: true,
    },
  });
}

module.exports = { previewEmail, sendEmail, listEmails, listRecipientOptions };
