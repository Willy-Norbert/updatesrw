const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const reportService = require('../services/report.service');

const create = asyncHandler(async (req, res) => {
  const data = await reportService.create(req.user, req.body);
  sendSuccess(res, { status: 201, message: 'Report submitted', data });
});

module.exports = { create };
