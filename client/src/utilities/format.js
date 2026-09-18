export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mediaUrl(url) {
  if (!url) return '';
  return url;
}

export function typeLabel(type) {
  const map = {
    TEXT: 'Update',
    IMAGE: 'Gallery',
    VIDEO: 'Video',
    EXPERIENCE: 'Experience',
    ACHIEVEMENT: 'Achievement',
    ARTICLE: 'Article',
  };
  return map[type] || 'Update';
}

export function roleLabel(role) {
  if (role === 'CHIEF_EDITOR') return 'Chief Editor';
  if (role === 'ADMIN') return 'Admin';
  return 'Member';
}
