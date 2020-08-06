const { CONTENT_TYPE_HEADER_MISSING, ACCEPT_HEADER_INVALID, CONTENT_TYPE_HEADER_INVALID, CHARSET_HEADER_INVALID, API_VERSION_INVALID } = require('../service/common');
const { BAD_REQUEST } = require('http-status-codes');
const contentType = require('content-type');

function validateContentType(headers, errors) {
    const contentTypeHeader = headers['content-type'];
    let contentTypeObj;

    if (contentTypeHeader) {
        try {
            contentTypeObj = contentType.parse(contentTypeHeader);
        } catch (err) {
            errors.push(CONTENT_TYPE_HEADER_INVALID);
        }
    } else {
        errors.push(CONTENT_TYPE_HEADER_MISSING);
    }

    if (contentTypeObj) {
        const type = contentTypeObj.type;
        const charset = contentTypeObj.parameters.charset;

        if (type !== 'application/json') {
            errors.push(CONTENT_TYPE_HEADER_INVALID);
        }

        if (charset && charset.toLowerCase() !== 'utf-8') {
            errors.push(CHARSET_HEADER_INVALID);
        }
    }
}

function validateAcceptHeader(headers, errors) {
    const acceptHeader = headers.accept && headers.accept.toLowerCase();

    if (acceptHeader && !acceptHeader.includes('*/*') && !acceptHeader.includes('application/json')) {
        errors.push(ACCEPT_HEADER_INVALID);
    }
}

function validateVersion(headers, errors) {
    const versionHeader = headers['api-version'];
    if (versionHeader !== '1.3.0') {
        errors.push(API_VERSION_INVALID);
    }
}

async function validateHeaders(ctx, next) {
    const errors = [];
    const headers = ctx.headers;
    if (ctx.method.toLowerCase() === 'post') {
        validateContentType(headers, errors);
    }
    validateAcceptHeader(headers, errors);
    validateVersion(headers, errors);

    if (errors.length > 0) {
        const headersValidationError = {
            statusCode: BAD_REQUEST,
            details: errors,
            more_info: errors.toString()
        };
        throw headersValidationError;
    }
    await next();
}

module.exports = {
    validateHeaders: validateHeaders
};
