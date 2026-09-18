const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const commentService = require('../services/comment.service');

const update = asyncHandler(async (req, res) => {
  const data = await commentService.update(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'Comment updated', data });
});

const remove = asyncHandler(async (req, res) => {
  await commentService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Comment deleted', data: null });
});

module.exports = { update, remove };
