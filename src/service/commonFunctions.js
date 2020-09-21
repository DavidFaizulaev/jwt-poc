const { get } = require('lodash');
const { PASS_THROUGH_HEADERS } = require('./common');

function formatDate(paymentMethod) {
    let expirationDate;
    if (paymentMethod.type === 'untokenized') {
        expirationDate = get(paymentMethod, 'expiration_date');
    }
    if (expirationDate === undefined) {
        return;
    }
    const delimiter = expirationDate[2];

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