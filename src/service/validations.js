const { get } = require('lodash');
const { CONFLICT, NOT_FOUND, BAD_REQUEST } = require('http-status-codes');
const {
    NOT_VALID_STATE, INITIAL_STATE,
    PAYMENT_CONFLICT, PAYMENT_CONFLICT_DESCRIPTION, AUTHORIZED, APP_ID_OF_PAYMENT_NOT_FOUND, PAYMENT_TOO_MANY_ACTIONS
} = require('../service/common');
const { MAX_ACTIONS_FOR_PAYMENT } = require('../service/config');
const { WRONG_PROVIDER_TYPE, WRONG_PROVIDER_TYPE_MORE_INFO, RISK_PROVIDER } = require('../service/common');

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

function validateAppId(paymentResource, headers){
    const paymentAppId = get(paymentResource, 'application_id');
    const paymentAccountId = get(paymentResource, 'merchant_id');
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

function checkMaxActionsOnPayment(paymentResource){
    let numberOfActions = 0;
    const actionsByType = paymentResource.actions_by_type;

    if (actionsByType && typeof actionsByType === 'object') {
        Object.keys(actionsByType).forEach((key) => {
            numberOfActions += Array.isArray(actionsByType[key]) ? actionsByType[key].length : 1;
        });
    }

    if (numberOfActions >= MAX_ACTIONS_FOR_PAYMENT) {
        const paymentStateError = {
            statusCode: BAD_REQUEST,
            details: [`${PAYMENT_TOO_MANY_ACTIONS} ${MAX_ACTIONS_FOR_PAYMENT}`]
        };
        throw paymentStateError;
    }
}

function validateProviderType(providerConfiguration) {
    if (providerConfiguration.providerType !== RISK_PROVIDER){
        const wrongProviderTypeError = {
            statusCode: BAD_REQUEST,
            details: [WRONG_PROVIDER_TYPE],
            more_info: WRONG_PROVIDER_TYPE_MORE_INFO.replace('[name]', providerConfiguration.providerName)
        };
        throw wrongProviderTypeError;
    }
}

module.exports = {
    validatePaymentState: validatePaymentState,
    validateAppId: validateAppId,
    checkMaxActionsOnPayment: checkMaxActionsOnPayment,
    validateProviderType: validateProviderType
};
