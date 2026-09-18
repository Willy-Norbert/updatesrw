const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const userService = require('../services/user.service');

const getProfile = asyncHandler(async (req, res) => {
  const data = await userService.getByUsername(req.params.username, req.user);
  sendSuccess(res, { message: 'User profile', data });
});

const getUserPosts = asyncHandler(async (req, res) => {
  const type = req.query.type || null;
  const data = await userService.listUserPosts(req.params.username, req.query, type, req.user);
  sendSuccess(res, { message: 'User posts', data: data.items, meta: data.meta });
});

const getAchievements = asyncHandler(async (req, res) => {
  const data = await userService.listUserPosts(req.params.username, req.query, 'ACHIEVEMENT', req.user);
  sendSuccess(res, { message: 'User achievements', data: data.items, meta: data.meta });
});

const getExperiences = asyncHandler(async (req, res) => {
  const data = await userService.listUserPosts(req.params.username, req.query, 'EXPERIENCE', req.user);
  sendSuccess(res, { message: 'User experiences', data: data.items, meta: data.meta });
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await userService.updateMe(req.user.id, req.body);
  sendSuccess(res, { message: 'Profile updated successfully', data });
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);
  sendSuccess(res, { message: 'Password updated successfully', data: null });
});

const updateAvatar = asyncHandler(async (req, res) => {
  const data = await userService.updateAvatar(req.user.id, req.file);
  sendSuccess(res, { message: 'Profile photo updated', data });
});

const getLikedPosts = asyncHandler(async (req, res) => {
  const data = await userService.listLikedPosts(req.params.username, req.query, req.user);
  sendSuccess(res, { message: 'Liked posts', data: data.items, meta: data.meta });
});

const mentionSuggestions = asyncHandler(async (req, res) => {
  const data = await userService.mentionSuggestions(req.query.q);
  sendSuccess(res, { message: 'Mention suggestions', data });
});

module.exports = {
  getProfile,
  getUserPosts,
  getAchievements,
  getExperiences,
  updateMe,
  changePassword,
  updateAvatar,
  getLikedPosts,
  mentionSuggestions,
};
