const { get, pick } = require('lodash');
const entitiesMapper = require('entities-mapper-v130').Payment;
const {
    HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_REQUEST_ID, X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_APP_NAME
} = require('../service/common');
const { ENVIRONMENT } = require('../service/config');
const fssIntegration = require('../service/integrations/fss-integration');
const fraudService = require('../service/integrations/payu-fraud-integration');
const psIntegration = require('../service/integrations/ps-integration');
const appsIntegration = require('../service/integrations/apps-storage-integration');
const { validatePaymentState, validateAppId, checkMaxActionsOnPayment } = require('../service/validations');

module.exports = {
    createRisk: createRisk,
    getRiskAnalysesById: getRiskAnalysesById,
    getRiskAnalyses: getRiskAnalyses
};

async function createRisk(ctx) {
    const { request, headers, params } = ctx;
    const merchantId = headers[HDR_X_ZOOZ_ACCOUNT_ID];
    let paymentMethod;

    const paymentStorageResponse = await psIntegration.getPaymentResource(params, headers);
    const paymentResource = paymentStorageResponse.data;
    validateAppId(paymentResource, headers);
    validatePaymentState(paymentResource);

    checkMaxActionsOnPayment(paymentResource);

    const requestPaymentMethod = get(request, 'body.payment_method');
    if (requestPaymentMethod){
        paymentMethod = await fssIntegration.handlePaymentMethodToken(merchantId, requestPaymentMethod, headers);
    }

    const providerConfigurationId = await appsIntegration.getDefaultProviderId(headers[HDR_X_ZOOZ_APP_NAME], headers);
    const riskResponse = await fraudService.createRisk(paymentResource, request.body, headers, providerConfigurationId, paymentMethod);

    const reqHeaders = pick(headers, [HDR_X_ZOOZ_REQUEST_ID, X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME]);
    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskResponse, reqHeaders, { environment: ENVIRONMENT });
    return mappedRiskAnalysisResource;
}

async function getRiskAnalyses(ctx) {
    const responseArray = [];
    const { params, headers } = ctx;
    const getRiskAnalysesResponse = await psIntegration.getRiskAnalyses(params, headers);
    const riskAnalysisResources = getRiskAnalysesResponse.data;

    for (let i = 0; i < riskAnalysisResources.length; i += 1) {
        const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskAnalysisResources[i], headers, { environment: ENVIRONMENT });
        responseArray.push(mappedRiskAnalysisResource);
    }
    return responseArray;
}

async function getRiskAnalysesById(ctx) {
    const { params, headers } = ctx;
    const getRiskResponse = await psIntegration.getRiskAnalysis(params, headers);

    const reqHeaders = pick(headers, [HDR_X_ZOOZ_REQUEST_ID, X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME]);
    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(getRiskResponse.data, reqHeaders, { environment: ENVIRONMENT });
    return mappedRiskAnalysisResource;
}
