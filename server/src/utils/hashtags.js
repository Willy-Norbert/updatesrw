function normalizeHashtag(value) {
  return String(value || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 40);
}

function extractHashtags(...parts) {
  const text = parts.filter(Boolean).join(' ');
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) || [];
  const extra = [];
  return [...new Set([...matches, ...extra].map(normalizeHashtag).filter(Boolean))];
}

function mergeHashtags(fromContent, explicit = []) {
  const list = [
    ...extractHashtags(fromContent),
    ...explicit.map(normalizeHashtag),
  ].filter(Boolean);
  return [...new Set(list)];
}

module.exports = { normalizeHashtag, extractHashtags, mergeHashtags };
