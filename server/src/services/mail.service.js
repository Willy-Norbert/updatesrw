const env = require('../config/env');
const prisma = require('../config/db');
const { layout, sendMail, sendBulkMail } = require('./mail.transport');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function postUrl(postId) {
  return `${env.clientUrl}/posts/${postId}`;
}

async function sendWelcomeEmail(user) {
  const html = layout({
    title: `Welcome to Updaterw, ${escapeHtml(user.fullName)}`,
    bodyHtml: `<p>Your account is ready. Explore builder stories, publish updates, and join the conversation.</p>
      <p style="color:#5c5c72">Username: <b>@${escapeHtml(user.username)}</b></p>`,
    ctaLabel: 'Open Updaterw',
    ctaUrl: env.clientUrl,
  });
  return sendMail({
    to: user.email,
    subject: 'Welcome to Updaterw',
    html,
  });
}

async function sendOtpEmail({ email, code, purpose }) {
  const isReset = purpose === 'RESET_PASSWORD';
  const html = layout({
    title: isReset ? 'Reset your password' : 'Verify your email',
    bodyHtml: `<p>Use this one-time code to ${isReset ? 'reset your password' : 'verify your Updaterw account'}:</p>
      <p style="font-size:32px;letter-spacing:0.18em;font-weight:700;margin:20px 0">${escapeHtml(code)}</p>
      <p style="color:#5c5c72">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
  });
  return sendMail({
    to: email,
    subject: isReset ? 'Your Updaterw password reset code' : 'Your Updaterw verification code',
    html,
  });
}

async function sendNewPostEmails(post, author) {
  if (post.status !== 'PUBLISHED') return [];
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailVerified: true,
      emailNotifications: true,
      NOT: { id: author.id },
    },
    select: { email: true, fullName: true },
  });
  if (!users.length) return [];

  const excerpt = escapeHtml(post.excerpt || post.plainText || '').slice(0, 220);
  const html = layout({
    title: escapeHtml(post.title),
    bodyHtml: `<p><b>${escapeHtml(author.fullName)}</b> just published a new update on Updaterw.</p>
      <p style="color:#5c5c72">${excerpt}${excerpt.length >= 220 ? '…' : ''}</p>`,
    ctaLabel: 'View post',
    ctaUrl: postUrl(post.id),
  });

  return sendBulkMail({
    recipients: users.map((user) => user.email),
    subject: `New on Updaterw: ${post.title}`,
    html,
  });
}

async function sendLikeEmail({ recipient, actor, post }) {
  if (!recipient?.email || recipient.id === actor.id || !recipient.emailNotifications) return null;
  const html = layout({
    title: 'Your post got a like',
    bodyHtml: `<p><b>${escapeHtml(actor.fullName)}</b> liked <b>${escapeHtml(post.title)}</b>.</p>`,
    ctaLabel: 'View post',
    ctaUrl: postUrl(post.id),
  });
  return sendMail({
    to: recipient.email,
    subject: `${actor.fullName} liked your post`,
    html,
  });
}

async function sendCommentEmail({ recipient, actor, post, comment, isReply }) {
  if (!recipient?.email || recipient.id === actor.id || !recipient.emailNotifications) return null;
  const snippet = escapeHtml(comment.content).slice(0, 180);
  const html = layout({
    title: isReply ? 'New reply on your comment' : 'New comment on your post',
    bodyHtml: `<p><b>${escapeHtml(actor.fullName)}</b> ${isReply ? 'replied on' : 'commented on'} <b>${escapeHtml(post.title)}</b>.</p>
      <p style="padding:12px 14px;background:#F8F8F8;border-left:3px solid #00B860;border-radius:6px">${snippet}${snippet.length >= 180 ? '…' : ''}</p>`,
    ctaLabel: 'View discussion',
    ctaUrl: `${postUrl(post.id)}#comments`,
  });
  return sendMail({
    to: recipient.email,
    subject: isReply ? `${actor.fullName} replied to your comment` : `${actor.fullName} commented on your post`,
    html,
  });
}

function buildCustomEmail({ subject, bodyHtml, ctaLabel, ctaUrl }) {
  return {
    subject,
    html: layout({
      title: escapeHtml(subject),
      bodyHtml,
      ctaLabel,
      ctaUrl,
    }),
  };
}

module.exports = {
  sendWelcomeEmail,
  sendOtpEmail,
  sendNewPostEmails,
  sendLikeEmail,
  sendCommentEmail,
  buildCustomEmail,
  escapeHtml,
  postUrl,
};
