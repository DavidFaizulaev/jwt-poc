const requestSender = require('../request-sender');
const { APPS_STORAGE_URL } = require('../config');
const { HDR_X_ZOOZ_REQUEST_ID } = require('../common');
const { handleIntegrationError } = require('./helpers/integration-error-handler');

const TARGET_NAME = 'application_storage';
const METRICS_ROUTE = '/v1/applications/:application_name';

async function getDefaultProviderId(appName, headers) {
    const url = `${APPS_STORAGE_URL}/v1/applications/${appName}`;
    const options = buildRequestOptions(headers, url);

    try {
        const response = await requestSender.sendRequest(options);
        return response.data.default_provider;
    } catch (error) {
        handleIntegrationError(error.response || error, TARGET_NAME);
    }
}

function buildRequestOptions(headers, url) {
    const options = {
        url: url,
        method: 'get',
        headers: {
            [HDR_X_ZOOZ_REQUEST_ID]: headers[HDR_X_ZOOZ_REQUEST_ID]
        },
        targetName: TARGET_NAME,
        metrics: { target: TARGET_NAME, route: METRICS_ROUTE }
    };
    return options;
}

module.exports = {
    getDefaultProviderId: getDefaultProviderId
};
