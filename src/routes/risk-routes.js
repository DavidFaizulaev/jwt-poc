const Router = require('koa-router');
const { validate } = require('express-ajv-swagger-validation');
const { createRisk, getRiskAnalyses, getRiskAnalysesById } = require('../controllers/risk-controller');
const { validateHeaders } = require('../middlewares/headers-validations');
const router = new Router();

router.post('/payments/:payment_id/risk-analyses', validate, validateHeaders, createRisk);
router.get('/payments/:payment_id/risk-analyses', validate, validateHeaders, getRiskAnalyses);
router.get('/payments/:payment_id/risk-analyses/:risk_analyses_id', validate, validateHeaders, getRiskAnalysesById);

module.exports = router;
