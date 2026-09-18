const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const { authenticateUser } = require('../middleware/authenticate');
const { imageUpload, videoUpload } = require('../middleware/upload');

const router = Router();

router.post('/images', authenticateUser, imageUpload.array('images', 8), uploadController.uploadImages);
router.post('/image', authenticateUser, imageUpload.single('image'), uploadController.uploadImage);
router.post('/video', authenticateUser, videoUpload.single('video'), uploadController.uploadVideo);

module.exports = router;
