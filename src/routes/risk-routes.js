const Router = require('koa-router');
const validateInput = require('openapi-validator-middleware').validate;
const { createRisk, getRiskAnalyses, getRiskAnalysesById } = require('../controllers/risk-controller');
const { validateHeaders } = require('../middlewares/headers-validations');
const router = new Router();

router.post('/payments/:payment_id/risk-analyses', validateInput, validateHeaders, createRisk);
router.get('/payments/:payment_id/risk-analyses', validateInput, validateHeaders, getRiskAnalyses);
router.get('/payments/:payment_id/risk-analyses/:risk_analyses_id', validateInput, validateHeaders, getRiskAnalysesById);

module.exports = router;
