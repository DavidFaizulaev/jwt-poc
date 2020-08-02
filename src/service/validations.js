const { get } = require('lodash');
const {
    NOT_VALID_STATE, INITIAL_STATE,
    PAYMENT_CONFLICT, PAYMENT_CONFLICT_DESCRIPTION, AUTHORIZED, APP_ID_OF_PAYMENT_NOT_FOUND
} = require('../service/common');
const { CONFLICT, NOT_FOUND } = require('http-status-codes');

function validatePaymentState(paymentResource) {
    const paymentState = get(paymentResource, 'payment_state.current_state');
    if (paymentState === NOT_VALID_STATE || (paymentState !== INITIAL_STATE && paymentState !== AUTHORIZED)) {
        const paymentStateError = {
            statusCode: CONFLICT,
            details: [PAYMENT_CONFLICT],
            more_info: PAYMENT_CONFLICT_DESCRIPTION
        };
        throw paymentStateError;
    }
}

function validateAppId(paymentResurce, headers){
    const paymentAppId = get(paymentResurce, 'application_id');
    const paymentAccountId = get(paymentResurce, 'merchant_id');
    const headerAppId = get(headers, 'x-zooz-app-name');
    const headerAccountId = get(headers, 'x-zooz-account-id');
    if (paymentAppId !== headerAppId || paymentAccountId !== headerAccountId) {
        const paymentNotFoundError = {
            statusCode: NOT_FOUND,
            details: [APP_ID_OF_PAYMENT_NOT_FOUND],
            more_info: APP_ID_OF_PAYMENT_NOT_FOUND
        };
        throw paymentNotFoundError;
    }
}

module.exports = {
    validatePaymentState: validatePaymentState,
    validateAppId: validateAppId
};