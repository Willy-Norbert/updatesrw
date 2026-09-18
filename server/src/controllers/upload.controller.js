const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { saveUpload } = require('../services/media.service');
const ApiError = require('../utils/ApiError');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  const data = await saveUpload(req.file, 'images');
  sendSuccess(res, { status: 201, message: 'Image uploaded', data });
});

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw new ApiError(400, 'At least one image is required');
  const data = [];
  for (const file of files) {
    data.push(await saveUpload(file, 'images'));
  }
  sendSuccess(res, { status: 201, message: 'Images uploaded', data });
});

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Video file is required');
  const data = await saveUpload(req.file, 'videos');
  sendSuccess(res, { status: 201, message: 'Video uploaded', data });
});

module.exports = { uploadImage, uploadImages, uploadVideo };
