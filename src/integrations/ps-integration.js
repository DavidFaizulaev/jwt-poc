const requestSender = require('../service/request-sender');
const { OK, CREATED, NOT_FOUND, INTERNAL_SERVER_ERROR } = require('http-status-codes');
const { get } = require('lodash');

const SERVER_ERROR = 'server_error';
const TARGET_NAME = 'payment_storage';

async function getPaymentResource(options) {
    const response = await requestSender.sendRequest(options);
    if (response.status !== OK && response.status !== CREATED) {
        handlePaymentStorageError(response);
    }
    return response;
};

function handlePaymentStorageError(response) {
    let paymentStorageError;

    if (response.status === NOT_FOUND) {
        paymentStorageError = {
            status: NOT_FOUND,
            details: {
                DETAILS: 'The resource was not found.'
            }
        };
    } else if (response instanceof Error) {
        paymentStorageError = {
            error_code: SERVER_ERROR,
            details: [get(response, 'stack').toString()],
            source: TARGET_NAME
        };
    } else {
        paymentStorageError = {
            status: INTERNAL_SERVER_ERROR,
            message: JSON.stringify(response.body),
            source: TARGET_NAME
        };
    }

    throw paymentStorageError;
}

module.exports = {
    getPaymentResource: getPaymentResource
};