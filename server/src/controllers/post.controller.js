const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const postService = require('../services/post.service');
const likeService = require('../services/like.service');
const commentService = require('../services/comment.service');
const bookmarkService = require('../services/bookmark.service');

const list = asyncHandler(async (req, res) => {
  const result = await postService.list(req.query, req.user);
  sendSuccess(res, { message: 'Posts', data: result.items, meta: result.meta });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await postService.getById(req.params.id, req.user);
  sendSuccess(res, { message: 'Post', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await postService.create(req.user, req.body);
  sendSuccess(res, { status: 201, message: 'Post created successfully', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await postService.update(req.params.id, req.user, req.body);
  sendSuccess(res, { message: 'Post updated successfully', data });
});

const remove = asyncHandler(async (req, res) => {
  await postService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Post deleted successfully', data: null });
});

const like = asyncHandler(async (req, res) => {
  const data = await likeService.like(req.params.id, req.user);
  sendSuccess(res, { message: 'Post liked', data });
});

const unlike = asyncHandler(async (req, res) => {
  const data = await likeService.unlike(req.params.id, req.user);
  sendSuccess(res, { message: 'Like removed', data });
});

const comments = asyncHandler(async (req, res) => {
  const data = await commentService.listByPost(req.params.id, req.user);
  sendSuccess(res, { message: 'Comments', data });
});

const addComment = asyncHandler(async (req, res) => {
  const data = await commentService.create(req.params.id, req.user, req.body);
  sendSuccess(res, { status: 201, message: 'Comment added', data });
});

const bookmark = asyncHandler(async (req, res) => {
  const data = await bookmarkService.add(req.params.id, req.user);
  sendSuccess(res, { message: 'Post bookmarked', data });
});

const unbookmark = asyncHandler(async (req, res) => {
  const data = await bookmarkService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Bookmark removed', data });
});

const likes = asyncHandler(async (req, res) => {
  const data = await likeService.listLikes(req.params.id);
  sendSuccess(res, { message: 'Post likes', data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  like,
  unlike,
  comments,
  addComment,
  bookmark,
  unbookmark,
  likes,
};
