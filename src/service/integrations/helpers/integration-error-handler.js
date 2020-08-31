const { get } = require('lodash');
const { NOT_FOUND, INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, getStatusText } = require('http-status-codes');

function handleIntegrationError(response, targetName) {
    let integrationError;
    const body = response.body || response.data;

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

module.exports = {
    handleIntegrationError: handleIntegrationError
};
