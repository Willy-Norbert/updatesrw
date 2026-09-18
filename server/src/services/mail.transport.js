const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (env.smtpEnabled) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.mail.user,
          pass: env.mail.pass,
        },
      });
      console.log(`Email: using Gmail SMTP as ${env.mail.user}`);
      return { transporter, mode: 'smtp' };
    }

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Email: using Ethereal test inbox ${testAccount.user}`);
    return { transporter, mode: 'ethereal' };
  })().catch((error) => {
    transporterPromise = null;
    throw error;
  });

  return transporterPromise;
}

function layout({ title, bodyHtml, ctaLabel, ctaUrl }) {
  const button = ctaLabel && ctaUrl
    ? `<p style="margin:28px 0 8px"><a href="${ctaUrl}" style="display:inline-block;background:#00B860;color:#000020;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${ctaLabel}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:Arial,sans-serif;color:#000020">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #E4E4EC;border-radius:8px;overflow:hidden">
    <div style="height:4px;background:#00B860"></div>
    <div style="padding:28px 28px 8px">
      <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5c5c72;font-weight:700">Updaterw</div>
      <h1 style="margin:12px 0 16px;font-size:24px;line-height:1.25">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#000020">${bodyHtml}</div>
      ${button}
    </div>
    <div style="padding:18px 28px 24px;font-size:12px;color:#5c5c72;border-top:1px solid #E4E4EC">
      You are receiving this because you have an Updaterw account or were added as a recipient.
    </div>
  </div>
</body>
</html>`;
}

async function sendMail({ to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return { accepted: [], previewUrl: null };

  const { transporter, mode } = await getTransporter();
  const info = await transporter.sendMail({
    from: env.mail.from,
    to: recipients.join(', '),
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });

  const previewUrl = mode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null;
  if (previewUrl) console.log(`Email preview: ${previewUrl}`);
  return { accepted: info.accepted || recipients, previewUrl, messageId: info.messageId };
}

async function sendBulkMail({ recipients, subject, html, text }) {
  const list = [...new Set((recipients || []).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean))];
  const results = [];
  for (const email of list) {
    try {
      const result = await sendMail({ to: email, subject, html, text });
      results.push({ email, ok: true, previewUrl: result.previewUrl });
    } catch (error) {
      console.error(`Failed to email ${email}`, error.message);
      results.push({ email, ok: false, error: error.message });
    }
  }
  return results;
}

module.exports = { layout, sendMail, sendBulkMail, getTransporter };
