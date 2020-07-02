const request = require('axios');
const { HttpMetricsCollector } = require('prometheus-api-metrics');
const logger = require('./logger');
const { SOUTHBOUND_BUCKETS, DEFAULT_REQUEST_RETRIES } = require('./config');

HttpMetricsCollector.init({ durationBuckets: SOUTHBOUND_BUCKETS });

async function sendRequest(options) {
    const requestDefaultOptions = {
        validateStatus: function (status) {
            return true;
        },
        responseType: 'json',
        retries: DEFAULT_REQUEST_RETRIES
    };

    Object.assign(requestDefaultOptions, options);

    return performRequest(requestDefaultOptions, requestDefaultOptions.retries);
}

async function performRequest(options, retriesLeft) {
    retriesLeft--;
    logger.trace(`Sending request to ${options.url}`);
    const requestTimeStamp = Date.now();
    let response;
    try {
        response = await request(options);
        HttpMetricsCollector.collect(response);
    } catch (error) {
        handleError(options, error, requestTimeStamp);
    }

    if (response.status >= 500) {
        logger.error(response, `Request failed. Attempt number ${options.retries - retriesLeft} of ${options.retries}.`);
        if (retriesLeft > 0) {
            return performRequest(options, retriesLeft);
        } else {
            return response;
        }
    }

    logger.info(response, `Callout to ${options.targetName}`);
    return response;
}

function handleError(options, error, requestTimeStamp) {
    const responseTimeStamp = Date.now();
    logger.error({
        error: error.message,
        request: {
            'utc-timestamp': requestTimeStamp,
            method: options.method,
            url: options.url,
            headers: options.headers,
            body: options.data,
            elapsed: responseTimeStamp - requestTimeStamp
        }
    }, `Error during request to ${options.targetName}`);

    throw error;
}

module.exports = {
    sendRequest: sendRequest
};
