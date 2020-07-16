const Router = require('koa-router');
const { validate } = require('express-ajv-swagger-validation');
const { createRisk, getRiskAnalyses, getRiskAnalysesById } = require('../controllers/risk-controller');
const router = new Router();

router.post('/payments/:payment_id/risk-analyses', validate, createRisk);
router.get('/payments/:payment_id/risk-analyses', validate, getRiskAnalyses);
router.get('/payments/:payment_id/risk-analyses/:risk_analyses_id', validate, getRiskAnalysesById);

module.exports = router;
