const crypto = require('crypto');
const env = require('../config/env');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { issueTokens } = require('./auth.service');
const { sendWelcomeEmail } = require('./mail.service');

const STATE_COOKIE = 'oauth_state';

function stateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: 10 * 60 * 1000,
  };
}

function providerConfig(provider) {
  if (provider === 'google') {
    if (!env.googleAuthEnabled) throw new ApiError(503, 'Google sign-in is not configured yet');
    return {
      provider: 'google',
      idField: 'googleId',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      clientId: env.oauth.googleClientId,
      clientSecret: env.oauth.googleClientSecret,
      scope: 'openid email profile',
      callbackPath: '/api/auth/google/callback',
    };
  }
  if (provider === 'github') {
    if (!env.githubAuthEnabled) throw new ApiError(503, 'GitHub sign-in is not configured yet');
    return {
      provider: 'github',
      idField: 'githubId',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user',
      emailsUrl: 'https://api.github.com/user/emails',
      clientId: env.oauth.githubClientId,
      clientSecret: env.oauth.githubClientSecret,
      scope: 'read:user user:email',
      callbackPath: '/api/auth/github/callback',
    };
  }
  throw new ApiError(400, 'Unsupported provider');
}

function beginOAuth(provider, res) {
  const config = providerConfig(provider);
  const state = crypto.randomBytes(24).toString('hex');
  res.cookie(STATE_COOKIE, `${provider}:${state}`, stateCookieOptions());

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${env.serverUrl}${config.callbackPath}`,
    response_type: 'code',
    scope: config.scope,
    state,
  });
  if (provider === 'google') {
    params.set('access_type', 'online');
    params.set('prompt', 'select_account');
  }
  return `${config.authUrl}?${params.toString()}`;
}

function assertState(provider, req) {
  const raw = req.cookies?.[STATE_COOKIE] || '';
  const [cookieProvider, cookieState] = raw.split(':');
  if (!cookieState || cookieProvider !== provider || cookieState !== req.query.state) {
    throw new ApiError(400, 'Invalid OAuth state. Try again.');
  }
}

async function exchangeCode(config, code) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: `${env.serverUrl}${config.callbackPath}`,
    grant_type: 'authorization_code',
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new ApiError(400, data.error_description || data.error || 'Could not complete OAuth login');
  }
  return data.access_token;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok || !data.email) {
    throw new ApiError(400, 'Could not read Google profile');
  }
  return {
    providerId: String(data.sub),
    email: String(data.email).toLowerCase(),
    fullName: data.name || data.email.split('@')[0],
    profileImage: data.picture || null,
    emailVerified: Boolean(data.email_verified),
  };
}

async function fetchGithubProfile(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Updaterw',
  };
  const userRes = await fetch('https://api.github.com/user', { headers });
  const user = await userRes.json();
  if (!userRes.ok) throw new ApiError(400, 'Could not read GitHub profile');

  let email = user.email ? String(user.email).toLowerCase() : null;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
    const emails = await emailsRes.json();
    if (Array.isArray(emails)) {
      const primary = emails.find((item) => item.primary && item.verified)
        || emails.find((item) => item.verified)
        || emails[0];
      email = primary?.email ? String(primary.email).toLowerCase() : null;
    }
  }
  if (!email) throw new ApiError(400, 'GitHub account has no public or verified email');

  return {
    providerId: String(user.id),
    email,
    fullName: user.name || user.login || email.split('@')[0],
    profileImage: user.avatar_url || null,
    emailVerified: true,
    usernameHint: user.login,
  };
}

async function uniqueUsername(base) {
  const cleaned = String(base || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'user';
  let candidate = cleaned;
  let n = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    n += 1;
    candidate = `${cleaned}${n}`.slice(0, 30);
  }
  return candidate;
}

async function upsertOAuthUser(provider, profile) {
  const idField = provider === 'google' ? 'googleId' : 'githubId';
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { [idField]: profile.providerId },
        { email: profile.email },
      ],
    },
  });

  const isNew = !user;
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        fullName: String(profile.fullName).slice(0, 80),
        username: await uniqueUsername(profile.usernameHint || profile.email.split('@')[0]),
        password: null,
        profileImage: profile.profileImage,
        emailVerified: true,
        onboardingCompleted: false,
        [idField]: profile.providerId,
      },
    });
    sendWelcomeEmail(user).catch((error) => console.error('Welcome email failed', error));
  } else {
    if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        [idField]: profile.providerId,
        emailVerified: true,
        profileImage: user.profileImage || profile.profileImage || null,
        lastLoginAt: new Date(),
      },
    });
  }

  return { user, isNew };
}

async function finishOAuth(provider, req, res) {
  assertState(provider, req);
  res.clearCookie(STATE_COOKIE, { path: '/' });

  const code = req.query.code;
  if (!code) throw new ApiError(400, 'Missing OAuth code');

  const config = providerConfig(provider);
  const accessToken = await exchangeCode(config, code);
  const profile = provider === 'google'
    ? await fetchGoogleProfile(accessToken)
    : await fetchGithubProfile(accessToken);

  if (provider === 'google' && !profile.emailVerified) {
    throw new ApiError(400, 'Google email is not verified');
  }

  const { user, isNew } = await upsertOAuthUser(provider, profile);
  const auth = await issueTokens(user, res);

  const params = new URLSearchParams({
    accessToken: auth.accessToken,
    provider,
    isNew: String(isNew),
  });
  return `${env.clientUrl}/oauth/callback?${params.toString()}`;
}

function oauthStatus() {
  return {
    google: env.googleAuthEnabled,
    github: env.githubAuthEnabled,
  };
}

module.exports = {
  beginOAuth,
  finishOAuth,
  oauthStatus,
};
