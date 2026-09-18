const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { authenticateUser } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { reportBody } = require('../validators/report.validator');

const router = Router();

router.post('/', authenticateUser, validate({ body: reportBody }), reportController.create);

module.exports = router;
