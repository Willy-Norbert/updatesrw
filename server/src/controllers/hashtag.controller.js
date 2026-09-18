const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const hashtagService = require('../services/hashtag.service');
const postService = require('../services/post.service');

const trending = asyncHandler(async (req, res) => {
  const data = await hashtagService.trending(Number(req.query.limit) || 12);
  sendSuccess(res, { message: 'Trending hashtags', data });
});

const recent = asyncHandler(async (req, res) => {
  const data = await hashtagService.recent(Number(req.query.limit) || 12);
  sendSuccess(res, { message: 'Recent hashtags', data });
});

const search = asyncHandler(async (req, res) => {
  const data = await hashtagService.search(req.query.q || '');
  sendSuccess(res, { message: 'Hashtag search', data });
});

const getOne = asyncHandler(async (req, res) => {
  const result = await postService.listByHashtag(req.params.name, req.query, req.user);
  sendSuccess(res, {
    message: 'Hashtag posts',
    data: result.items,
    meta: { ...result.meta, hashtag: result.hashtag },
  });
});

module.exports = { trending, recent, search, getOne };
