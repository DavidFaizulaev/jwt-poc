'use strict';

const httpStatusCodes = require('http-status-codes');
const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR, getStatusText } = httpStatusCodes;
const INTERNAL_SERVER_ERROR_MESSAGE = getStatusText(INTERNAL_SERVER_ERROR);
const NOT_FOUND_ERROR_MESSAGE = getStatusText(NOT_FOUND);
const BAD_REQUEST_ERROR_MESSAGE = getStatusText(BAD_REQUEST);

module.exports.handleError = async function (ctx, next) {
    try {
        await next();
        if (ctx.status === httpStatusCodes.NOT_FOUND && !ctx.body) {
            ctx.throw(NOT_FOUND, { details: NOT_FOUND_ERROR_MESSAGE });
        }
    } catch (error) {
        await _handleError(error, ctx);
    }
};

const _handleError = function (error, ctx) {
    let details, statusCode;
    if (error.status) {
        // Service errors
        statusCode = error.status;
        details = error.details;
    } else if (error instanceof SyntaxError) {
        // malformed json
        statusCode = BAD_REQUEST;
        details = BAD_REQUEST_ERROR_MESSAGE;
    } else {
        // unexpected errors
        statusCode = INTERNAL_SERVER_ERROR;
        details = INTERNAL_SERVER_ERROR_MESSAGE;
    }

    const responseBody = buildResponseBody(details, error.stack);

    ctx.status = statusCode;
    ctx.body = responseBody;
};

function buildResponseBody(details, moreInfo) {
    return {
        details: [details.toString()],
        moreInfo
    };
}
