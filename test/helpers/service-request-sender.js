'use strict';
const request = require('axios');

const createRisk = async (requestOptions) => {
    const completeRequest = {
        url: `${requestOptions.serviceUrl}/payments/${requestOptions.paymentId}/risk-analyses`,
        headers: requestOptions.headers,
        responseType: 'json',
        data: requestOptions.body,
        method: 'post'
    };

    return request(completeRequest);
};

const healthCheck = async (serviceUrl) => {
    const completeRequest = {
        url: `${serviceUrl}/health`,
        headers: {
            'content-type': 'application/json',
            accept: 'application/json'
        },
        responseType: 'json',
        method: 'get'
    };

    return request(completeRequest);
};

const getMetrics = async (serviceUrl) => {
    const completeRequest = {
        url: `${serviceUrl}/metrics.json`,
        headers: {
            'content-type': 'application/json',
            accept: 'application/json'
        },
        responseType: 'json',
        method: 'get'
    };

    return request(completeRequest);
};

module.exports = {
    createRisk: createRisk,
    healthCheck: healthCheck,
    getMetrics: getMetrics
};
