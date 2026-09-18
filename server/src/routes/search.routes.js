const { Router } = require('express');
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/authenticate');

const router = Router();

router.get('/', optionalAuth, searchController.search);

module.exports = router;
