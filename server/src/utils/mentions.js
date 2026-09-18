function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

function extractMentions(...parts) {
  const text = parts.filter(Boolean).join(' ');
  const matches = text.match(/@([a-zA-Z0-9_]{2,30})/g) || [];
  return [...new Set(matches.map(normalizeUsername).filter(Boolean))];
}

module.exports = { normalizeUsername, extractMentions };
