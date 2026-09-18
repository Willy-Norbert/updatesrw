const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const adminService = require('../services/admin.service');
const postService = require('../services/post.service');
const commentService = require('../services/comment.service');
const likeService = require('../services/like.service');
const reportService = require('../services/report.service');
const categoryService = require('../services/category.service');

const stats = asyncHandler(async (req, res) => {
  const data = await adminService.stats();
  sendSuccess(res, { message: 'Platform statistics', data });
});

const users = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  sendSuccess(res, { message: 'Users', data: result.items, meta: result.meta });
});

const changeRole = asyncHandler(async (req, res) => {
  const data = await adminService.changeRole(req.params.id, req.body.role, req.user);
  sendSuccess(res, { message: 'User role updated', data });
});

const setActive = asyncHandler(async (req, res) => {
  const data = await adminService.setActive(req.params.id, req.body.isActive, req.user);
  sendSuccess(res, { message: req.body.isActive ? 'User restored' : 'User deactivated', data });
});

const posts = asyncHandler(async (req, res) => {
  const result = await adminService.listAllPosts(req.query);
  sendSuccess(res, { message: 'Posts', data: result.items, meta: result.meta });
});

const deletePost = asyncHandler(async (req, res) => {
  await postService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Post deleted', data: null });
});

const hidePost = asyncHandler(async (req, res) => {
  const data = await postService.setHidden(req.params.id, req.body.hidden, req.user);
  sendSuccess(res, { message: req.body.hidden ? 'Post hidden' : 'Post restored', data });
});

const featurePost = asyncHandler(async (req, res) => {
  const data = await postService.setFeatured(req.params.id, req.body.featured, req.user);
  sendSuccess(res, { message: req.body.featured ? 'Post featured' : 'Post unfeatured', data });
});

const comments = asyncHandler(async (req, res) => {
  const result = await adminService.listAllComments(req.query);
  sendSuccess(res, { message: 'Comments', data: result.items, meta: result.meta });
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Comment deleted', data: null });
});

const hideComment = asyncHandler(async (req, res) => {
  const data = await commentService.hide(req.params.id, req.body.hidden);
  sendSuccess(res, { message: req.body.hidden ? 'Comment hidden' : 'Comment restored', data });
});

const removeLike = asyncHandler(async (req, res) => {
  const data = await likeService.adminRemoveLike(req.params.postId, req.params.userId);
  sendSuccess(res, { message: "User's like was removed", data });
});

const reports = asyncHandler(async (req, res) => {
  const result = await reportService.list(req.query);
  sendSuccess(res, { message: 'Reports', data: result.items, meta: result.meta });
});

const updateReport = asyncHandler(async (req, res) => {
  const data = await reportService.updateStatus(req.params.id, req.body.status, req.user.id);
  sendSuccess(res, { message: 'Report updated', data });
});

const createCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.create(req.body);
  sendSuccess(res, { status: 201, message: 'Category created', data });
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.update(req.params.id, req.body);
  sendSuccess(res, { message: 'Category updated', data });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  sendSuccess(res, { message: 'Category deleted', data: null });
});

const hashtags = asyncHandler(async (req, res) => {
  const result = await adminService.listHashtags(req.query);
  sendSuccess(res, { message: 'Hashtags', data: result.items, meta: result.meta });
});

const deleteHashtag = asyncHandler(async (req, res) => {
  await adminService.deleteHashtag(req.params.id);
  sendSuccess(res, { message: 'Hashtag deleted', data: null });
});

const emailBroadcast = require('../services/emailBroadcast.service');

const emailPreview = asyncHandler(async (req, res) => {
  const data = await emailBroadcast.previewEmail({ ...req.body, senderId: req.user.id });
  sendSuccess(res, { message: 'Email preview', data });
});

const emailSend = asyncHandler(async (req, res) => {
  const data = await emailBroadcast.sendEmail({ ...req.body, senderId: req.user.id });
  sendSuccess(res, { message: 'Email sent', data });
});

const emailHistory = asyncHandler(async (req, res) => {
  const data = await emailBroadcast.listEmails();
  sendSuccess(res, { message: 'Email history', data });
});

const emailRecipients = asyncHandler(async (req, res) => {
  const data = await emailBroadcast.listRecipientOptions(req.query.q || '');
  sendSuccess(res, { message: 'Recipients', data });
});

module.exports = {
  stats,
  users,
  changeRole,
  setActive,
  posts,
  deletePost,
  hidePost,
  featurePost,
  comments,
  deleteComment,
  hideComment,
  removeLike,
  reports,
  updateReport,
  createCategory,
  updateCategory,
  deleteCategory,
  hashtags,
  deleteHashtag,
  emailPreview,
  emailSend,
  emailHistory,
  emailRecipients,
};
