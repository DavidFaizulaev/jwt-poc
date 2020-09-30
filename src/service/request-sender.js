const axios = require('axios');
const axiosTime = require('axios-time');
const requestRetry = require('axios-retry');
const { HttpMetricsCollector } = require('prometheus-api-metrics');
const { get } = require('lodash');
const { requestLogger } = require('./logger');
const { DEFAULT_REQUEST_RETRIES } = require('./config');
const { SOUTHBOUND_BUCKETS } = require('./common');

HttpMetricsCollector.init({ durationBuckets: SOUTHBOUND_BUCKETS, includeQueryParams: false });

async function sendRequest(options) {
    const requestDefaultOptions = {
        responseType: 'json',
        retries: DEFAULT_REQUEST_RETRIES
    };

    Object.assign(requestDefaultOptions, options);

    return performRequest(requestDefaultOptions);
}

async function performRequest(options) {
    requestLogger.trace(`Sending request to ${options.url}`);
    let response;
    try {
        const client = axios.create({ baseURL: options.url });
        axiosTime(client);
        await requestRetry(client, {
            retries: DEFAULT_REQUEST_RETRIES,
            retryCondition: function (error) {
                return (get(error, 'response.status') >= 500 || !error.response);
            }
        });
        response = await client(options);
        HttpMetricsCollector.collect(response);
    } catch (error) {
        HttpMetricsCollector.collect(error);
        requestLogger.error({ error }, `Callout to ${options.targetName}`);
        throw error;
    }

    requestLogger.info({ response }, `Callout to ${options.targetName}`);
    return response;
}

module.exports = {
    sendRequest: sendRequest
};
