const { Router } = require('express');
const { z } = require('zod');
const adminController = require('../controllers/admin.controller');
const { authenticateUser } = require('../middleware/authenticate');
const { requireAdmin, requireChiefEditor } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { roleBody, activeBody, featuredBody, hideBody, categoryBody } = require('../validators/admin.validator');
const { reportStatusBody } = require('../validators/report.validator');

const idParam = z.object({ id: z.string().uuid() });
const likeParams = z.object({
  postId: z.string().uuid(),
  userId: z.string().uuid(),
});

const router = Router();

router.use(authenticateUser);

router.get('/stats', requireAdmin, adminController.stats);
router.get('/users', requireAdmin, adminController.users);
router.patch('/users/:id/role', requireAdmin, validate({ params: idParam, body: roleBody }), adminController.changeRole);
router.patch('/users/:id/active', requireAdmin, validate({ params: idParam, body: activeBody }), adminController.setActive);

router.get('/posts', requireChiefEditor, adminController.posts);
router.delete('/posts/:id', requireAdmin, validate({ params: idParam }), adminController.deletePost);
router.patch('/posts/:id/hide', requireChiefEditor, validate({ params: idParam, body: hideBody }), adminController.hidePost);
router.patch('/posts/:id/feature', requireChiefEditor, validate({ params: idParam, body: featuredBody }), adminController.featurePost);
router.delete(
  '/posts/:postId/likes/:userId',
  requireAdmin,
  validate({ params: likeParams }),
  adminController.removeLike
);

router.get('/comments', requireChiefEditor, adminController.comments);
router.delete('/comments/:id', requireChiefEditor, validate({ params: idParam }), adminController.deleteComment);
router.patch('/comments/:id/hide', requireChiefEditor, validate({ params: idParam, body: hideBody }), adminController.hideComment);

router.get('/reports', requireChiefEditor, adminController.reports);
router.patch('/reports/:id', requireChiefEditor, validate({ params: idParam, body: reportStatusBody }), adminController.updateReport);

router.post('/categories', requireChiefEditor, validate({ body: categoryBody }), adminController.createCategory);
router.patch('/categories/:id', requireChiefEditor, validate({ params: idParam, body: categoryBody.partial() }), adminController.updateCategory);
router.delete('/categories/:id', requireChiefEditor, validate({ params: idParam }), adminController.deleteCategory);

router.get('/hashtags', requireChiefEditor, adminController.hashtags);
router.delete('/hashtags/:id', requireChiefEditor, validate({ params: idParam }), adminController.deleteHashtag);

router.get('/emails', requireChiefEditor, adminController.emailHistory);
router.get('/emails/recipients', requireChiefEditor, adminController.emailRecipients);
router.post('/emails/preview', requireChiefEditor, adminController.emailPreview);
router.post('/emails/send', requireChiefEditor, adminController.emailSend);

module.exports = router;
