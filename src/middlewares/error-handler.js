'use strict';

const httpStatusCodes = require('http-status-codes');
const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR, getStatusText } = httpStatusCodes;
const NOT_FOUND_ERROR_MESSAGE = getStatusText(NOT_FOUND);
const { InputValidationError } = require('express-ajv-swagger-validation');
const { HDR_X_ZOOZ_REQUEST_ID } = require('../service/common');
const { logger } = require('../service/logger');

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
    let details;
    let moreInfo;
    let statusCode;
    let errorType = 'unexpectedError';
    const errorStatus = error.statusCode || error.status;

    if (errorStatus === BAD_REQUEST) {
        statusCode = BAD_REQUEST;
        details = error.details || error.message;
        errorType = getStatusText(BAD_REQUEST);
    } else if (errorStatus) {
        statusCode = errorStatus;
        details = error.details || error.message;
        moreInfo = error.more_info;
        errorType = getStatusText(errorStatus);
    } else if (error instanceof InputValidationError) {
        // validation errors
        statusCode = BAD_REQUEST;
        moreInfo = error.errors;
        errorType = 'InputValidationError';
    } else if (error instanceof SyntaxError) {
        // malformed json
        statusCode = BAD_REQUEST;
        errorType = 'SyntaxError';
        logger.error('malformed json: ', error);
    } else {
        // unexpected errors
        statusCode = INTERNAL_SERVER_ERROR;
        details = error.error || error.message || getStatusText(INTERNAL_SERVER_ERROR);
    }

    const responseBody = buildResponseBody(details, moreInfo);
    logger.error({
        [HDR_X_ZOOZ_REQUEST_ID]: ctx.headers[HDR_X_ZOOZ_REQUEST_ID],
        statusCode,
        path: ctx.href,
        request_headers: JSON.stringify(ctx.headers),
        request_body_str: JSON.stringify(ctx.body)
    }, `Error type "${errorType}" was encountered: ${JSON.stringify(responseBody)}`);

    ctx.status = statusCode;
    ctx.body = responseBody;
};

function buildResponseBody(details, moreInfo) {
    return {
        details: details ? [details.toString()] : undefined,
        moreInfo
    };
}
