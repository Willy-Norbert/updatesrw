const { Router } = require('express');
const postController = require('../controllers/post.controller');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const { validate, idParam } = require('../middleware/validate');
const { postBody, postQuery } = require('../validators/post.validator');
const { commentBody } = require('../validators/comment.validator');

const router = Router();

router.get('/', optionalAuth, validate({ query: postQuery }), postController.list);
router.get('/:id', optionalAuth, validate({ params: idParam }), postController.getOne);
router.post('/', authenticateUser, validate({ body: postBody }), postController.create);
router.put('/:id', authenticateUser, validate({ params: idParam, body: postBody.partial() }), postController.update);
router.delete('/:id', authenticateUser, validate({ params: idParam }), postController.remove);
router.post('/:id/like', authenticateUser, validate({ params: idParam }), postController.like);
router.delete('/:id/like', authenticateUser, validate({ params: idParam }), postController.unlike);
router.get('/:id/comments', optionalAuth, validate({ params: idParam }), postController.comments);
router.post(
  '/:id/comments',
  authenticateUser,
  validate({ params: idParam, body: commentBody }),
  postController.addComment
);
router.get('/:id/likes', optionalAuth, validate({ params: idParam }), postController.likes);
router.post('/:id/bookmark', authenticateUser, validate({ params: idParam }), postController.bookmark);
router.delete('/:id/bookmark', authenticateUser, validate({ params: idParam }), postController.unbookmark);

module.exports = router;
