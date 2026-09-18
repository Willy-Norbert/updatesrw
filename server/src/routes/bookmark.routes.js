const { Router } = require('express');
const bookmarkController = require('../controllers/bookmark.controller');
const { authenticateUser } = require('../middleware/authenticate');

const router = Router();

router.get('/', authenticateUser, bookmarkController.list);

module.exports = router;
