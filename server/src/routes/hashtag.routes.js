const { Router } = require('express');
const hashtagController = require('../controllers/hashtag.controller');
const { optionalAuth } = require('../middleware/authenticate');

const router = Router();

router.get('/trending', hashtagController.trending);
router.get('/recent', hashtagController.recent);
router.get('/search', hashtagController.search);
router.get('/:name', optionalAuth, hashtagController.getOne);

module.exports = router;
