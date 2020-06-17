'use strict';
const Router = require('koa-router');
const router = new Router();
const { health } = require('../controllers/health');

router.get('/health', health);

module.exports = router;
