const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const uploadRoutes = require('./upload.routes');
const commentRoutes = require('./comment.routes');
const bookmarkRoutes = require('./bookmark.routes');
const hashtagRoutes = require('./hashtag.routes');
const notificationRoutes = require('./notification.routes');
const categoryRoutes = require('./category.routes');
const reportRoutes = require('./report.routes');
const searchRoutes = require('./search.routes');
const adminRoutes = require('./admin.routes');
const mentionRoutes = require('./mention.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/uploads', uploadRoutes);
router.use('/comments', commentRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/hashtags', hashtagRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);
router.use('/reports', reportRoutes);
router.use('/search', searchRoutes);
router.use('/mentions', mentionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
