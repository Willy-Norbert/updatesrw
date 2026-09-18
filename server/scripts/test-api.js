/**
 * End-to-end API smoke test for the Updaterw backend.
 * Start the server first: npm run dev
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_URL || 'https://updatesrwtech.vercel.app';
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(method, url, { token, body, form, expectStatus = 200 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const json = await res.json().catch(() => ({}));
  results.push({ method, url, status: res.status, success: json.success, message: json.message });
  if (res.status !== expectStatus) {
    throw new Error(`${method} ${url} expected ${expectStatus} got ${res.status}: ${json.message}`);
  }
  return json;
}

function tinyPng() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
}

async function main() {
  const suffix = Date.now();
  const password = 'Testuser123';
  const register = await request('POST', '/api/auth/register', {
    body: {
      username: `tester${suffix}`,
      fullName: 'API Tester',
      email: `tester${suffix}@updaterw.local`,
      password,
    },
    expectStatus: 201,
  });
  assert(register.data.accessToken, 'register should return access token');
  const token = register.data.accessToken;

  const me = await request('GET', '/api/auth/me', { token });
  assert(me.data.username === `tester${suffix}`, 'me should return the user');

  const login = await request('POST', '/api/auth/login', {
    body: { identifier: me.data.email, password },
  });
  assert(login.data.accessToken, 'login should return access token');

  const categories = await request('GET', '/api/categories');
  const categoryId = categories.data[0]?.id;

  const form = new FormData();
  form.append('image', new Blob([tinyPng()], { type: 'image/png' }), 'dot.png');
  const uploadRes = await fetch(`${BASE}/api/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const uploaded = await uploadRes.json();
  results.push({ method: 'POST', url: '/api/uploads/image', status: uploadRes.status, success: uploaded.success });
  assert(uploadRes.status === 201 && uploaded.data?.url, 'image upload should work');

  const videoPath = path.join(__dirname, '../../public/loader-light.mp4');
  let videoMedia = null;
  if (fs.existsSync(videoPath)) {
    const buf = fs.readFileSync(videoPath);
    const vform = new FormData();
    vform.append('video', new Blob([buf], { type: 'video/mp4' }), 'clip.mp4');
    const vres = await fetch(`${BASE}/api/uploads/video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: vform,
    });
    const vjson = await vres.json();
    results.push({ method: 'POST', url: '/api/uploads/video', status: vres.status, success: vjson.success });
    assert(vres.status === 201 && vjson.data?.url, 'video upload should work');
    videoMedia = vjson.data;
  }

  const created = await request('POST', '/api/posts', {
    token,
    expectStatus: 201,
    body: {
      title: 'Testing Prisma with Cursor #PostgreSQL',
      content: '<p>Hello <strong>@willy</strong> — useful #React and #NodeJS notes.</p>',
      categoryId,
      hashtags: ['Cursor', 'AI'],
      media: [
        { url: uploaded.data.url, type: 'IMAGE', mimeType: uploaded.data.mimeType, size: uploaded.data.size },
        ...(videoMedia
          ? [{ url: videoMedia.url, type: 'VIDEO', mimeType: videoMedia.mimeType, size: videoMedia.size }]
          : []),
      ],
    },
  });
  const postId = created.data.id;
  assert(postId, 'post should be created');
  assert(created.data.hashtags.some((tag) => tag.name === 'react'), 'hashtags should be normalized');

  const edited = await request('PUT', `/api/posts/${postId}`, {
    token,
    body: { title: 'Updated Prisma notes with Cursor' },
  });
  assert(edited.data.title.includes('Updated'), 'post should update');

  const liked = await request('POST', `/api/posts/${postId}/like`, { token });
  assert(liked.data.liked === true, 'like should work');
  const unliked = await request('DELETE', `/api/posts/${postId}/like`, { token });
  assert(unliked.data.liked === false, 'unlike should work');
  await request('POST', `/api/posts/${postId}/like`, { token });

  const comment = await request('POST', `/api/posts/${postId}/comments`, {
    token,
    expectStatus: 201,
    body: { content: 'Great write-up @john' },
  });
  const reply = await request('POST', `/api/posts/${postId}/comments`, {
    token,
    expectStatus: 201,
    body: { content: 'Adding a reply', parentCommentId: comment.data.id },
  });
  assert(reply.data.parentCommentId === comment.data.id, 'reply should nest');

  await request('POST', `/api/posts/${postId}/bookmark`, { token });
  const bookmarks = await request('GET', '/api/bookmarks', { token });
  assert(bookmarks.data.length >= 1, 'bookmark list should include the post');

  await request('POST', '/api/reports', {
    token,
    expectStatus: 201,
    body: { targetType: 'POST', postId, reason: 'Testing the report workflow for moderation.' },
  });

  const experience = await request('POST', '/api/posts', {
    token,
    expectStatus: 201,
    body: {
      title: 'My experience learning Prisma',
      content: '<p>The schema-first workflow clicked after the first migration.</p>',
      postType: 'EXPERIENCE',
      lessonsLearned: 'Keep models normalized and add indexes early.',
      hashtags: ['Prisma'],
    },
  });
  assert(experience.data.postType === 'EXPERIENCE', 'experience post type');

  const achievement = await request('POST', '/api/posts', {
    token,
    expectStatus: 201,
    body: {
      title: 'Shipped the Updaterw API',
      content: '<p>Backend, Prisma, and auth are live.</p>',
      postType: 'ACHIEVEMENT',
      organization: 'Updaterw',
      achievementDate: '2026-09-18',
      hashtags: ['NodeJS'],
    },
  });
  assert(achievement.data.postType === 'ACHIEVEMENT', 'achievement post type');

  const search = await request('GET', `/api/search?q=${encodeURIComponent('Prisma')}`);
  assert(Array.isArray(search.data.posts), 'search should return posts');

  const paged = await request('GET', '/api/posts?page=1&limit=10');
  assert(paged.meta && paged.meta.limit === 10, 'pagination meta required');

  const notes = await request('GET', '/api/notifications', { token });
  assert(Array.isArray(notes.data), 'notifications should list');

  const adminLogin = await request('POST', '/api/auth/login', {
    body: {
      identifier: process.env.ADMIN_EMAIL || 'admin@updaterw.local',
      password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
    },
  });
  const adminToken = adminLogin.data.accessToken;

  await request('DELETE', `/api/admin/posts/${postId}/likes/${me.data.id}`, { token: adminToken });
  await request('DELETE', `/api/admin/comments/${comment.data.id}`, { token: adminToken });

  const forbidden = await request('GET', '/api/admin/stats', { token, expectStatus: 403 });
  assert(forbidden.success === false, 'normal user cannot read admin stats');

  const editorLogin = await request('POST', '/api/auth/login', {
    body: {
      identifier: process.env.CHIEF_EDITOR_EMAIL || 'editor@updaterw.local',
      password: process.env.CHIEF_EDITOR_PASSWORD || 'Editor123!@#',
    },
  });
  await request('GET', '/api/admin/stats', { token: editorLogin.data.accessToken, expectStatus: 403 });
  await request('PATCH', `/api/admin/posts/${achievement.data.id}/feature`, {
    token: editorLogin.data.accessToken,
    body: { featured: true },
  });

  await request('DELETE', `/api/posts/${experience.data.id}`, { token });
  await request('DELETE', `/api/admin/posts/${achievement.data.id}`, { token: adminToken });
  await request('DELETE', `/api/posts/${postId}`, { token });

  console.log('\nAPI tests passed.\n');
  console.table(results.map((row) => ({ method: row.method, url: row.url, status: row.status })));
}

main().catch((error) => {
  console.error('\nAPI tests failed:', error.message);
  console.table(results);
  process.exit(1);
});
