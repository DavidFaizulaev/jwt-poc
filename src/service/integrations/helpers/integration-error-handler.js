const { get } = require('lodash');
const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, getStatusText } = require('http-status-codes');
const { PAYMENT_STORAGE_ERROR_MAPPINGS } = require('../../common');
const PS_TARGET_NAME = 'payment_storage';

function handleIntegrationError(response, targetName) {
    let integrationError;
    const body = response.body || response.data;

    if (targetName === PS_TARGET_NAME) {
        paymentStorageErrorHandler(response, targetName);
    }

    if (response.status === NOT_FOUND) {
        integrationError = {
            statusCode: NOT_FOUND,
            more_info: get(body, 'message'),
            source: targetName
        };
    } else if (response.status === SERVICE_UNAVAILABLE) {
        const errorDetails = get(body, 'details') || getStatusText(SERVICE_UNAVAILABLE);
        integrationError = {
            statusCode: SERVICE_UNAVAILABLE,
            details: errorDetails,
            more_info: get(body, 'message') || getStatusText(SERVICE_UNAVAILABLE),
            source: targetName
        };
    } else if (response instanceof Error) {
        const errorDetails = get(response, 'stack') || 'unexpectedError';
        integrationError = {
            error_code: INTERNAL_SERVER_ERROR,
            details: [errorDetails],
            source: targetName
        };
    } else {
        integrationError = {
            status: INTERNAL_SERVER_ERROR,
            message: JSON.stringify(body) || response.message,
            source: targetName
        };
    }

    throw integrationError;
}

function paymentStorageErrorHandler(response, targetName) {
    let psIntegrationError;
    const responseBody = response.body || response.data;
    if ((response.status === BAD_REQUEST && responseBody.error_code === PAYMENT_STORAGE_ERROR_MAPPINGS.INVALID_PAYMENT_ID_ERROR_CODE) ||
        (response.status === NOT_FOUND && (responseBody.error_code === PAYMENT_STORAGE_ERROR_MAPPINGS.PAYMENT_NOT_FOUND_ERROR_CODE ||
            responseBody.error_code === PAYMENT_STORAGE_ERROR_MAPPINGS.ACTION_NOT_FOUND_ERROR_CODE))) {
        psIntegrationError = {
            statusCode: response.status,
            details: get(responseBody, 'details'),
            source: targetName
        };
    } else if (response.status === NOT_FOUND) {
        psIntegrationError = {
            statusCode: response.INTERNAL_SERVER_ERROR,
            details: JSON.stringify(responseBody),
            source: targetName
        };
    }

    if (psIntegrationError) throw psIntegrationError;
}

module.exports = {
    handleIntegrationError: handleIntegrationError
};
