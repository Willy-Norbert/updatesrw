const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticateUser, optionalAuth } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { updateProfileBody, changePasswordBody } = require('../validators/user.validator');
const { profileUpload } = require('../middleware/upload');

const router = Router();

router.get('/mentions', authenticateUser, userController.mentionSuggestions);
router.patch('/me', authenticateUser, validate({ body: updateProfileBody }), userController.updateMe);
router.patch('/me/password', authenticateUser, validate({ body: changePasswordBody }), userController.changePassword);
router.post('/me/avatar', authenticateUser, profileUpload.single('image'), userController.updateAvatar);
router.get('/:username', optionalAuth, userController.getProfile);
router.get('/:username/posts', optionalAuth, userController.getUserPosts);
router.get('/:username/achievements', optionalAuth, userController.getAchievements);
router.get('/:username/experiences', optionalAuth, userController.getExperiences);
router.get('/:username/likes', optionalAuth, userController.getLikedPosts);

module.exports = router;
