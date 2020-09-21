const { get, pick } = require('lodash');
const entitiesMapper = require('entities-mapper-v130').Payment;
const { HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_APP_NAME } = require('../service/common');
const { ENVIRONMENT } = require('../service/config');
const fssIntegration = require('../service/integrations/fss-integration');
const fraudService = require('../service/integrations/payu-fraud-integration');
const psIntegration = require('../service/integrations/ps-integration');
const appsIntegration = require('../service/integrations/apps-storage-integration');
const { validatePaymentState, validateAppId, checkMaxActionsOnPayment, validateProviderType } = require('../service/validations');
const { getConfiguration } = require('../service/integrations/pcs-integration');
const { getPassThroughHeaders } = require('../service/commonFunctions');

module.exports = {
    createRisk: createRisk,
    getRiskAnalysesById: getRiskAnalysesById,
    getRiskAnalyses: getRiskAnalyses
};

async function createRisk(ctx) {
    const { request, headers, params } = ctx;
    const merchantId = headers[HDR_X_ZOOZ_ACCOUNT_ID];
    const filteredHeaders = getPassThroughHeaders(headers);
    let paymentMethod;

    const paymentStorageResponse = await psIntegration.getPaymentResource(params, filteredHeaders);
    const paymentResource = paymentStorageResponse.data;
    validateAppId(paymentResource, headers);
    validatePaymentState(paymentResource);

    checkMaxActionsOnPayment(paymentResource);

    const requestPaymentMethod = get(request, 'body.payment_method');
    if (requestPaymentMethod){
        paymentMethod = await fssIntegration.handlePaymentMethodToken(merchantId, requestPaymentMethod, filteredHeaders);
    }

    const providerConfigurationId = await appsIntegration.getDefaultProviderId(headers[HDR_X_ZOOZ_APP_NAME], filteredHeaders);

    // Call pcs integration
    const providerConfiguration = await getConfiguration(providerConfigurationId, filteredHeaders);
    validateProviderType(providerConfiguration);

    const riskResponse = await fraudService.createRisk(paymentResource, request.body, filteredHeaders, providerConfigurationId, paymentMethod, providerConfiguration.providerName);

    const reqHeaders = pick(headers, [HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME]);
    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskResponse, reqHeaders, { environment: ENVIRONMENT });
    return mappedRiskAnalysisResource;
}

async function getRiskAnalyses(ctx) {
    const responseArray = [];
    const { params, headers } = ctx;
    const filteredHeaders = getPassThroughHeaders(headers);
    const getRiskAnalysesResponse = await psIntegration.getRiskAnalyses(params, filteredHeaders);
    const riskAnalysisResources = getRiskAnalysesResponse.data;

    for (let i = 0; i < riskAnalysisResources.length; i += 1) {
        const reqHeaders = pick(headers, [HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME]);
        const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(riskAnalysisResources[i], reqHeaders, { environment: ENVIRONMENT });
        responseArray.push(mappedRiskAnalysisResource);
    }
    return responseArray;
}

async function getRiskAnalysesById(ctx) {
    const { params, headers } = ctx;
    const filteredHeaders = getPassThroughHeaders(headers);
    const getRiskResponse = await psIntegration.getRiskAnalysis(params, filteredHeaders);

    const reqHeaders = pick(headers, [HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_ACCESS_ENVIRONMENT, HDR_X_ZOOZ_ACCOUNT_ID, HDR_X_ZOOZ_APP_NAME]);
    const mappedRiskAnalysisResource = await entitiesMapper.mapRiskAnalysis(getRiskResponse.data, reqHeaders, { environment: ENVIRONMENT });
    return mappedRiskAnalysisResource;
}
