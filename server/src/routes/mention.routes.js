const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticateUser } = require('../middleware/authenticate');

const router = Router();

router.get('/', authenticateUser, userController.mentionSuggestions);

module.exports = router;
