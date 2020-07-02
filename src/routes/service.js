'use strict';

const Router = require('koa-router');
const router = new Router();
const { getRiskAnalyses, getRiskAnalysesById } = require('../controllers/riskAnalyses');

router.get('/payments/:payment_id/risk-analyses', getRiskAnalyses);

router.get('/payments/:payment_id/risk-analyses/:risk_analyses_id', getRiskAnalysesById);

module.exports = router;