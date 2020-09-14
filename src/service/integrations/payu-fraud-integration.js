const { cloneDeep, get } = require('lodash');
const uuid = require('uuid');
const { TOKENIZED_PAYMENT_METHOD_NAME, UNTOKENIZED_PAYMENT_METHOD_NAME, CREDIT_CARD_PAYMENT_METHOD_NAME, HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_IDEPMOTENCY, HDR_X_CLIENT_IP_ADDRESS, HDR_X_ZOOZ_API_PROXY_VERSION } = require('../common');
const requestHelper = require('../request-sender');
const { FRAUD_SERVICE_URL, ENVIRONMENT, RISK_PROVIDER_SERVICE_NAME } = require('../config');
const { handleIntegrationError } = require('./helpers/integration-error-handler');

const TARGET_NAME = 'risk_provider';
const METRICS_ROUTE = '/payments/:payment_id/risk-analyses';
const COMPLETE_METRICS_ROUTE = { target: `${ENVIRONMENT}-${RISK_PROVIDER_SERVICE_NAME}`, route: METRICS_ROUTE };

module.exports = {
    createRisk: createRisk
};

async function createRisk(paymentResource, requestBody, headers, providerConfigurationId, paymentMethod) {
    const body = buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod, headers);
    const reqHeaders = {
        [HDR_X_ZOOZ_IDEPMOTENCY]: headers[HDR_X_ZOOZ_IDEPMOTENCY] || uuid.v4(),
        [HDR_X_ZOOZ_REQUEST_ID]: headers[HDR_X_ZOOZ_REQUEST_ID],
        [HDR_X_ZOOZ_API_PROXY_VERSION]: '1.0'
    };
    const requestOptions = {
        url: buildRequestUrl(paymentResource.id),
        data: body,
        headers: reqHeaders,
        method: 'post',
        targetName: TARGET_NAME,
        metrics: COMPLETE_METRICS_ROUTE
    };
    let fraudResponse;
    try {
        fraudResponse = await requestHelper.sendRequest(requestOptions);
    } catch (error) {
        handleIntegrationError(error.response || error);
    }
    return fraudResponse.data;
}

function buildRequestUrl(paymentId) {
    const baseUrl = buildBaseUrl();
    return `${baseUrl}/payments/${paymentId}/risk-analyses`;
}

function buildBaseUrl() {
    const baseUrl = FRAUD_SERVICE_URL.replace('{SERVICE_NAME}', `risk-${ENVIRONMENT}-${RISK_PROVIDER_SERVICE_NAME}`);
    return baseUrl;
}

function buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod, headers) {
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
    copiedRequestBody.provider_specific_data = mapProviderSpecificData(requestBody);

    return {
        risk_data: copiedRequestBody,
        payment_resource: paymentResource,
        provider_configuration_id: providerConfigurationId
    };
}

function mapProviderSpecificData(requestBody) {
    const providerSpecificData = get(requestBody, 'provider_specific_data');

    for (const providerName in providerSpecificData) {
        if (providerName.replace(/_/g, '').toLowerCase() === RISK_PROVIDER_SERVICE_NAME.replace(/-/g, '').toLowerCase()) {
            return providerSpecificData[providerName];
        }
    }
}

function isUntokenizedCreditCardRequest(paymentMethod) {
    return paymentMethod && paymentMethod.type === UNTOKENIZED_PAYMENT_METHOD_NAME &&
        paymentMethod.source_type === CREDIT_CARD_PAYMENT_METHOD_NAME;
}