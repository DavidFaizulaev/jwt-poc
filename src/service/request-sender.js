const axios = require('axios');
const axiosTimingPlugin = require('axios-timing-plugin');
axiosTimingPlugin(axios);
const requestRetry = require('axios-retry');
const { get } = require('lodash');
const { requestLogger } = require('./logger');
const { DEFAULT_REQUEST_RETRIES } = require('./config');

async function sendRequest(options) {
    const requestDefaultOptions = {
        responseType: 'json',
        retries: DEFAULT_REQUEST_RETRIES
    };

    Object.assign(requestDefaultOptions, options);

    return performRequest(requestDefaultOptions, requestDefaultOptions.retries);
}

async function performRequest(options) {
    requestLogger.trace(`Sending request to ${options.url}`);
    let response;
    try {
        const client = axios.create({ baseURL: options.url });
        await requestRetry(client, {
            retries: DEFAULT_REQUEST_RETRIES,
            retryCondition: function (error) {
                return (get(error, 'response.status') >= 500 || !error.response);
            }
        });
        response = await client(options);
    } catch (error) {
        requestLogger.error({ error }, `Callout to ${options.targetName}`);
        throw error;
    }

    requestLogger.info({ response }, `Callout to ${options.targetName}`);
    return response;
}

module.exports = {
    sendRequest: sendRequest
};
