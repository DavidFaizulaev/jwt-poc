const { get } = require('lodash');
const entitiesMapper = require('entities-mapper-v130').Payment;
const {
    HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME
} = require('../service/common');
const fssIntegration = require('../service/integrations/fss-integration');
const fraudService = require('../service/integrations/payu-fraud-integration');
const psIntegration = require('../service/integrations/ps-integration');
const appsIntegration = require('../service/integrations/apps-storage-integration');
const { validatePaymentState, validateAppId } = require('../service/validations');

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

    const requestPaymentMethod = get(request, 'body.payment_method');
    if (requestPaymentMethod){
        paymentMethod = await fssIntegration.handlePaymentMethodToken(merchantId, requestPaymentMethod, headers);
    }

    const providerConfigurationId = await appsIntegration.getDefaultProviderId(headers[HDR_X_ZOOZ_APP_NAME], headers);
    const riskResponse = await fraudService.createRisk(paymentResource, request.body, headers, providerConfigurationId, paymentMethod);

    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskResponse, headers);
    return mappedRiskAnalysisResource;
}

async function getRiskAnalyses(ctx) {
    const responseArray = [];
    const { params, headers } = ctx;
    const getRiskAnalysesResponse = await psIntegration.getRiskAnalyses(params, headers);
    const riskAnalysisResources = getRiskAnalysesResponse.data;

    for (let i = 0; i < riskAnalysisResources.length; i += 1) {
        const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskAnalysisResources[i], headers);
        responseArray.push(mappedRiskAnalysisResource);
    }
    return responseArray;
};

async function getRiskAnalysesById(ctx) {
    const { params, headers } = ctx;
    const getRiskResponse = await psIntegration.getRiskAnalysis(params, headers);

    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(getRiskResponse.data, headers);
    return mappedRiskAnalysisResource;
}