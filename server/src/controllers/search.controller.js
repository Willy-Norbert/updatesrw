const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const searchService = require('../services/search.service');

const search = asyncHandler(async (req, res) => {
  const data = await searchService.search(
    { q: req.query.q, type: req.query.type || 'all' },
    req.user
  );
  sendSuccess(res, { message: 'Search results', data });
});

module.exports = { search };
