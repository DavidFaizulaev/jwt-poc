const psIntegration = require('../integrations/ps-integration');
const { PAYMENT_STORAGE_URL } = require('../service/config');
const { HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION, HDR_X_ZOOZ_REQUEST_ID } = require('../service/common');

function buildRequestOptions(ctx, url) {
    const { headers } = ctx;

    const options = {
        url: url,
        method: 'get',
        headers: {
            [HDR_X_ZOOZ_REQUEST_ID]: headers[HDR_X_ZOOZ_REQUEST_ID],
            [HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION]: '1.0'
        }
    };
    return options;
};

async function getRiskAnalyses(ctx) {
    const { params } = ctx;
    const paymentId = params.payment_id;
    const url = `${PAYMENT_STORAGE_URL}/payments/${paymentId}/risk_analyses`;
    const options = buildRequestOptions(ctx, url);
    const result = await psIntegration.getPaymentResource(options);
    return result;
};

async function getRiskAnalysesById(ctx) {
    const { params } = ctx;
    const paymentId = params.payment_id;
    const riskAnalysesId = params.risk_analyses_id;
    const url = `${PAYMENT_STORAGE_URL}/payments/${paymentId}/risk_analyses/${riskAnalysesId}`;
    const options = buildRequestOptions(ctx, url);
    const result = await psIntegration.getPaymentResource(options);
    return result;
}

module.exports = {
    getRiskAnalyses: getRiskAnalyses,
    getRiskAnalysesById: getRiskAnalysesById
};