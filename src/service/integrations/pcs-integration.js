'use strict';
const requestSender = require('../request-sender');
const { HDR_X_ZOOZ_ACCESS_ENVIRONMENT, PCS_TARGET_NAME } = require('../common');
const { handleIntegrationError } = require('./helpers/integration-error-handler');
const { PROVIDER_CONFIGURATIONS_URL, ENVIRONMENT } = require('../config');

const METRICS_ROUTES = {
    GET_PROVIDER_CONFIGURATION: 'v1/configurations/:configuration_id'
};

async function getConfiguration(providerConfigurationId, headers) {
    const url = `${PROVIDER_CONFIGURATIONS_URL}/v1/configurations/${providerConfigurationId}?ext_info=true&filterConfData=true`;
    const options = buildRequestOptions(headers, url, METRICS_ROUTES.GET_PROVIDER_CONFIGURATION);
    try {
        const response = await requestSender.sendRequest(options);
        return response.data;
    } catch (error) {
        handleIntegrationError(error.response || error, PCS_TARGET_NAME);
    }
}

function buildRequestOptions(headers, url, metricsRoute) {
    const integrationHeaders = { [HDR_X_ZOOZ_ACCESS_ENVIRONMENT]: ENVIRONMENT };
    Object.assign(integrationHeaders, headers);
    const options = {
        url: url,
        method: 'get',
        headers: integrationHeaders,
        targetName: PCS_TARGET_NAME,
        metrics: { target: PCS_TARGET_NAME, route: metricsRoute }
    };
    return options;
}

module.exports = {
    getConfiguration: getConfiguration
};
