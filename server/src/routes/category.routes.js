const { Router } = require('express');
const { z } = require('zod');
const categoryController = require('../controllers/category.controller');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const { requireChiefEditor } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { categoryBody } = require('../validators/admin.validator');

const router = Router();

router.get('/', optionalAuth, categoryController.list);
router.get('/:slug', optionalAuth, categoryController.getOne);
router.post('/', authenticateUser, requireChiefEditor, validate({ body: categoryBody }), categoryController.create);
router.patch(
  '/:id',
  authenticateUser,
  requireChiefEditor,
  validate({ params: z.object({ id: z.string().uuid() }), body: categoryBody.partial() }),
  categoryController.update
);
router.delete(
  '/:id',
  authenticateUser,
  requireChiefEditor,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  categoryController.remove
);

module.exports = router;
