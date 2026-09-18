const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticateUser } = require('../middleware/authenticate');
const { validate, idParam } = require('../middleware/validate');

const router = Router();

router.get('/', authenticateUser, notificationController.list);
router.post('/read-all', authenticateUser, notificationController.markAllRead);
router.post('/:id/read', authenticateUser, validate({ params: idParam }), notificationController.markRead);

module.exports = router;
