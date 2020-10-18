const { get } = require('lodash');
const { PASS_THROUGH_HEADERS } = require('./common');
const { logger } = require('./logger');
const { BAD_REQUEST } = require('http-status-codes');

function formatDate(paymentMethod) {
    let expirationDate;
    if (paymentMethod.type === 'untokenized') {
        expirationDate = get(paymentMethod, 'expiration_date');
    }
    if (expirationDate === undefined) {
        return;
    }
    const delimiter = expirationDate[2];

    if (delimiter !== ' ' && delimiter !== '.' && delimiter !== '/' && delimiter !== '-') {
        logger.info(`expiration_date is not valid because structure is incorrect. expiration_date: ${expirationDate}`);
        const invalidFormat = {
            statusCode: BAD_REQUEST,
            more_info: 'expiration_date does not have a valid format'
        };
        throw invalidFormat;
    }

    const dateParts = expirationDate.split(delimiter);
    const month = dateParts[0];
    let year = dateParts[1];

    if (year.length === 2) {
        year = `20${year}`;
    }

    return month + '/' + year;
}

function getPassThroughHeaders(requestHeaders) {
    const headers = requestHeaders || {};
    const passHeaders = {};
    Object.keys(headers)
        .forEach(function (header) {
            const headerToAdd = PASS_THROUGH_HEADERS.find(function (prefix) {
                return (header.toLowerCase()).startsWith(prefix);
            });
            if (headerToAdd) {
                passHeaders[header] = headers[header];
            }
        });
    return passHeaders;
}

module.exports = {
    formatDate: formatDate,
    getPassThroughHeaders: getPassThroughHeaders
};
