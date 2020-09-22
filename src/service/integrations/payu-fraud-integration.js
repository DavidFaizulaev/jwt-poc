const { cloneDeep, get } = require('lodash');
const uuid = require('uuid');
const { TOKENIZED_PAYMENT_METHOD_NAME, UNTOKENIZED_PAYMENT_METHOD_NAME, CREDIT_CARD_PAYMENT_METHOD_NAME, HDR_X_ZOOZ_IDEPMOTENCY, HDR_X_CLIENT_IP_ADDRESS, HDR_X_ZOOZ_API_PROXY_VERSION } = require('../common');
const requestHelper = require('../request-sender');
const { FRAUD_SERVICE_URL, ENVIRONMENT, PROVIDER_TARGET_TIMEOUT } = require('../config');
const { handleIntegrationError } = require('./helpers/integration-error-handler');

const TARGET_NAME = 'risk_provider';
const METRICS_ROUTE = '/payments/:payment_id/risk-analyses';

module.exports = {
    createRisk: createRisk
};

async function createRisk(paymentResource, requestBody, headers, providerConfigurationId, paymentMethod, providerName) {
    const COMPLETE_METRICS_ROUTE = { target: `${ENVIRONMENT}-${providerName}`, route: METRICS_ROUTE };
    const body = buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod, headers, providerName);
    const integrationHeaders = {
        [HDR_X_ZOOZ_IDEPMOTENCY]: headers[HDR_X_ZOOZ_IDEPMOTENCY] || uuid.v4(),
        [HDR_X_ZOOZ_API_PROXY_VERSION]: '1.0'
    };
    Object.assign(integrationHeaders, headers);
    const requestOptions = {
        url: buildRequestUrl(paymentResource.id, providerName.toLowerCase()),
        data: body,
        headers: integrationHeaders,
        method: 'post',
        targetName: TARGET_NAME,
        metrics: COMPLETE_METRICS_ROUTE,
        timeout: PROVIDER_TARGET_TIMEOUT
    };
    let fraudResponse;
    try {
        fraudResponse = await requestHelper.sendRequest(requestOptions);
    } catch (error) {
        handleIntegrationError(error.response || error);
    }
    return fraudResponse.data;
}

function buildRequestUrl(paymentId, providerName) {
    const baseUrl = FRAUD_SERVICE_URL.replace('{SERVICE_NAME}', `risk-${ENVIRONMENT}-${providerName}`);
    return `${baseUrl}/payments/${paymentId}/risk-analyses`;
}

function buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod, headers, providerName) {
    const copiedRequestBody = cloneDeep(requestBody);

    copiedRequestBody.payment_method = paymentMethod;

    if (paymentMethod && !isUntokenizedCreditCardRequest(paymentMethod)) {
        copiedRequestBody.payment_method = {
            type: TOKENIZED_PAYMENT_METHOD_NAME,
            token: paymentMethod.token,
            credit_card_cvv: paymentMethod.credit_card_cvv
        };
    }

    copiedRequestBody.ip_address = headers[HDR_X_CLIENT_IP_ADDRESS];
    copiedRequestBody.provider_specific_data = mapProviderSpecificData(requestBody, providerName);

    return {
        risk_data: copiedRequestBody,
        payment_resource: paymentResource,
        provider_configuration_id: providerConfigurationId
    };
}

function mapProviderSpecificData(requestBody, riskProviderName) {
    const providerSpecificData = get(requestBody, 'provider_specific_data');

    for (const providerName in providerSpecificData) {
        if (providerName.replace(/_/g, '').toLowerCase() === riskProviderName.replace(/-/g, '').toLowerCase()) {
            return providerSpecificData[providerName];
        }
    }
}

function isUntokenizedCreditCardRequest(paymentMethod) {
    return paymentMethod && paymentMethod.type === UNTOKENIZED_PAYMENT_METHOD_NAME &&
        paymentMethod.source_type === CREDIT_CARD_PAYMENT_METHOD_NAME;
}
