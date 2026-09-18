const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const bookmarkService = require('../services/bookmark.service');

const list = asyncHandler(async (req, res) => {
  const result = await bookmarkService.list(req.user, req.query);
  sendSuccess(res, { message: 'Bookmarks', data: result.items, meta: result.meta });
});

module.exports = { list };
