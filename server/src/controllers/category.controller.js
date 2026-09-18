const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const categoryService = require('../services/category.service');

const list = asyncHandler(async (req, res) => {
  const data = await categoryService.list();
  sendSuccess(res, { message: 'Categories', data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await categoryService.getBySlug(req.params.slug);
  sendSuccess(res, { message: 'Category', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await categoryService.create(req.body);
  sendSuccess(res, { status: 201, message: 'Category created', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.update(req.params.id, req.body);
  sendSuccess(res, { message: 'Category updated', data });
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  sendSuccess(res, { message: 'Category deleted', data: null });
});

module.exports = { list, getOne, create, update, remove };
