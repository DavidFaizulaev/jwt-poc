const { cloneDeep } = require('lodash');
const uuid = require('uuid');
const { HttpMetricsCollector } = require('prometheus-api-metrics');
const { TOKENIZED_PAYMENT_METHOD_NAME, UNTOKENIZED_PAYMENT_METHOD_NAME, CREDIT_CARD_PAYMENT_METHOD_NAME, HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_IDEPMOTENCY, HDR_X_CLIENT_IP_ADDRESS, HDR_X_ZOOZ_API_PROXY_VERSION } = require('../common');
const requestHelper = require('../request-sender');
const { SOUTHBOUND_BUCKETS, FRAUD_SERVICE_URL, ENVIRONMENT, RISK_PROVIDER_SERVICE_NAME } = require('../config');
const { handleIntegrationError } = require('./helpers/integration-error-handler');
HttpMetricsCollector.init({ durationBuckets: SOUTHBOUND_BUCKETS });

const createRiskMetricsPath = { target: FRAUD_SERVICE_URL, route: '/payments/:payment_id/risk-analyses' };
const TARGET_NAME = 'risk_provider';

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
        targetName: TARGET_NAME
    };
    let fraudResponse;
    try {
        fraudResponse = await requestHelper.sendRequest(requestOptions);
    } catch (error) {
        handleIntegrationError(error.response || error);
    }
    collectSouthboundMetrics(fraudResponse, HttpMetricsCollector, createRiskMetricsPath);
    return fraudResponse.data;
}

function buildRequestUrl(paymentId) {
    const baseUrl = FRAUD_SERVICE_URL.replace('{SERVICE_NAME}', `risk-${ENVIRONMENT}-${RISK_PROVIDER_SERVICE_NAME}`);
    return `${baseUrl}/payments/${paymentId}/risk-analyses`;
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

    return {
        risk_data: copiedRequestBody,
        payment_resource: paymentResource,
        provider_configuration_id: providerConfigurationId
    };
}

function isUntokenizedCreditCardRequest(paymentMethod) {
    return paymentMethod && paymentMethod.type === UNTOKENIZED_PAYMENT_METHOD_NAME &&
        paymentMethod.source_type === CREDIT_CARD_PAYMENT_METHOD_NAME;
}

function collectSouthboundMetrics(requestObject, httpMetricsCollector, requestPath) {
    requestObject.request.metrics = requestPath;
    httpMetricsCollector.collect(requestObject);
}
