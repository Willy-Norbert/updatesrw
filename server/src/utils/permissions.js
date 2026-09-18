function canModerate(user) {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'CHIEF_EDITOR'));
}

function canEditPost(user, post) {
  if (!user || !post) return false;
  if (user.role === 'ADMIN' || user.role === 'CHIEF_EDITOR') return true;
  return post.authorId === user.id;
}

function canDeletePost(user, post) {
  if (!user || !post) return false;
  if (user.role === 'ADMIN') return true;
  return post.authorId === user.id;
}

function canDeleteComment(user, comment) {
  if (!user || !comment) return false;
  if (user.role === 'ADMIN' || user.role === 'CHIEF_EDITOR') return true;
  return comment.authorId === user.id;
}

function canViewPost(user, post) {
  if (!post) return false;
  if (post.status === 'PUBLISHED') return true;
  if (!user) return false;
  if (post.authorId === user.id) return true;
  return canModerate(user);
}

module.exports = {
  canModerate,
  canEditPost,
  canDeletePost,
  canDeleteComment,
  canViewPost,
};
