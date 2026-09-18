function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    profileImage: user.profileImage,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function privateUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    email: user.email,
    isActive: user.isActive,
    emailVerified: Boolean(user.emailVerified),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    emailNotifications: user.emailNotifications !== false,
    hasPassword: Boolean(user.password),
    googleLinked: Boolean(user.googleId),
    githubLinked: Boolean(user.githubId),
    lastLoginAt: user.lastLoginAt,
    updatedAt: user.updatedAt,
  };
}

function adminUser(user, counts = {}) {
  return {
    ...privateUser(user),
    _count: counts,
  };
}

module.exports = { publicUser, privateUser, adminUser };
