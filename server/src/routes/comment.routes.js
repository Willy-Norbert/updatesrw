const { Router } = require('express');
const commentController = require('../controllers/comment.controller');
const { authenticateUser } = require('../middleware/authenticate');
const { validate, idParam } = require('../middleware/validate');
const { commentUpdateBody } = require('../validators/comment.validator');

const router = Router();

router.patch('/:id', authenticateUser, validate({ params: idParam, body: commentUpdateBody }), commentController.update);
router.delete('/:id', authenticateUser, validate({ params: idParam }), commentController.remove);

module.exports = router;
