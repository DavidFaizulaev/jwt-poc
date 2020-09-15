const requestSender = require('../request-sender');
const { PAYMENT_STORAGE_URL } = require('../config');
const { HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION, HDR_X_ZOOZ_REQUEST_ID } = require('../common');
const { handleIntegrationError } = require('./helpers/integration-error-handler');

const TARGET_NAME = 'payment_storage';
const METRICS_ROUTES = {
    GET_PAYMENT_RESOURCE: 'payments/:payment_id',
    GET_RISK_ANALYSES_ALL: 'payments/:payment_id/risk-analyses',
    GET_RISK_ANALYSES_RESOURCE: 'payments/:payment_id/risk-analyses/:risk-analyses_id'
};

async function getPaymentResource(params, headers) {
    const paymentId = params.payment_id;
    const url = `${PAYMENT_STORAGE_URL}/payments/${paymentId}`;
    const options = buildRequestOptions(headers, url, METRICS_ROUTES.GET_PAYMENT_RESOURCE);
    try {
        const response = await requestSender.sendRequest(options);
        return response;
    } catch (error) {
        handleIntegrationError(error.response || error, TARGET_NAME);
    }
}

async function getRiskAnalyses(params, headers) {
    const paymentId = params.payment_id;
    const url = `${PAYMENT_STORAGE_URL}/payments/${paymentId}/risk-analyses`;
    const options = buildRequestOptions(headers, url, METRICS_ROUTES.GET_RISK_ANALYSES_ALL);
    try {
        const response = await requestSender.sendRequest(options);
        return response;
    } catch (error) {
        handleIntegrationError(error.response || error, TARGET_NAME);
    }
}

async function getRiskAnalysis(params, headers) {
    const paymentId = params.payment_id;
    const riskId = params.risk_analyses_id;
    const url = `${PAYMENT_STORAGE_URL}/payments/${paymentId}/risk-analyses/${riskId}`;
    const options = buildRequestOptions(headers, url, METRICS_ROUTES.GET_RISK_ANALYSES_RESOURCE);
    try {
        const response = await requestSender.sendRequest(options);
        return response;
    } catch (error) {
        handleIntegrationError(error.response || error, TARGET_NAME);
    }
}

function buildRequestOptions(headers, url, metricsRoute) {
    const options = {
        url: url,
        method: 'get',
        headers: {
            [HDR_X_ZOOZ_REQUEST_ID]: headers[HDR_X_ZOOZ_REQUEST_ID],
            [HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION]: '1.0'
        },
        targetName: TARGET_NAME,
        metrics: { target: TARGET_NAME, route: metricsRoute }
    };
    return options;
}

module.exports = {
    getPaymentResource: getPaymentResource,
    getRiskAnalyses: getRiskAnalyses,
    getRiskAnalysis: getRiskAnalysis
};
