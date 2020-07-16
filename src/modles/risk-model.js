const { get } = require('lodash');
const {
    HDR_X_ZOOZ_ACCOUNT_ID, NOT_VALID_STATE, INITIAL_STATE,
    PAYMENT_CONFLICT, PAYMENT_CONFLICT_DESCRIPTION, HDR_X_ZOOZ_APP_NAME
} = require('../service/common');
const { CONFLICT } = require('http-status-codes');
const fssIntegration = require('../service/integrations/fss-integration');
const fraudService = require('../service/integrations/payu-fraud-integration');
const { formatDate } = require('../service/commonFunctions');
const psIntegration = require('../service/integrations/ps-integration');
const appsIntegration = require('../service/integrations/apps-storage-integration');

module.exports = {
    createRisk: createRisk,
    getRiskAnalysesById: getRiskAnalysesById,
    getRiskAnalyses: getRiskAnalyses
};

async function createRisk(ctx) {
    const { request, headers, params } = ctx;
    const merchantId = headers[HDR_X_ZOOZ_ACCOUNT_ID];

    const paymentStorageResponse = await psIntegration.getPaymentResource(params, headers);
    const paymentResource = paymentStorageResponse.data;
    validatePaymentState(paymentResource);

    let paymentMethod = get(request, 'body.payment_method');
    validateExpirationDate(paymentMethod);
    paymentMethod = await fssIntegration.handlePaymentMethodToken(merchantId, paymentMethod, headers);

    const providerConfigurationId = await appsIntegration.getDefaultProviderId(headers[HDR_X_ZOOZ_APP_NAME], headers);
    const riskResponse = await fraudService.createRisk(paymentResource, request.body, headers, providerConfigurationId, paymentMethod);
    return riskResponse;
}

async function getRiskAnalyses(ctx) {
    const { params, headers } = ctx;
    const result = await psIntegration.getRiskAnalyses(params, headers);
    return result.data;
};

async function getRiskAnalysesById(ctx) {
    const { params, headers } = ctx;
    const result = await psIntegration.getRiskAnalysis(params, headers);
    return result.data;
}

function validateExpirationDate(paymentMethod) {
    if (paymentMethod.untokenized_request) {
        const expirationDate = get(paymentMethod, 'untokenized_request.credit_card_request.expiration_date');
        // TODO When the proxy request is ready this result will be saved in a variable which will be added to the request
        formatDate(expirationDate);
    }
}

function validatePaymentState(paymentResource) {
    const paymentState = get(paymentResource, 'payment_state.current_state');
    if (paymentState === NOT_VALID_STATE || paymentState !== INITIAL_STATE) {
        const paymentStateError = {
            statusCode: CONFLICT,
            details: [PAYMENT_CONFLICT],
            more_info: PAYMENT_CONFLICT_DESCRIPTION
        };
        throw paymentStateError;
    }
}
