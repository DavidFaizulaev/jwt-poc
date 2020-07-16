const path = require('path');

module.exports = {
    // general
    SWAGGER_PATH: path.join(__dirname, '../../', 'docs', 'swagger.yaml'),

    // Headers
    HDR_X_ZOOZ_ACCOUNT_ID: 'x-zooz-account-id',
    HDR_X_ZOOZ_APP_NAME: 'x-zooz-app-name',
    HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION: 'x-zooz-payment-service-api-version',
    HDR_X_ZOOZ_ENV: 'x-payments-os-env',
    HDR_X_ZOOZ_PAYMENT_SERVICE_REQUEST_ID: 'X-Zooz-Payment-Service-Request-Id',
    HDR_X_ZOOZ_REQUEST_ID: 'x-zooz-request-id',
    HDR_X_ZOOZ_ACCESS_ENVIRONMENT: 'x-zooz-access-environment',
    HDR_X_ZOOZ_IDEPMOTENCY: 'x-zooz-proxy-request-id',

    // Payment states
    NOT_VALID_STATE: 'not_valid',
    INITIAL_STATE: 'payment_initial',

    // Conflict errors
    PAYMENT_CONFLICT: 'Please check the current state of the payment.',
    PAYMENT_CONFLICT_DESCRIPTION: 'There was conflict with payment resource current state.',

    // FSS
    CREDIT_CARD_FSS_PAYMENT_METHOD_NAME: 'CreditCard',
    UNTOKENIZED_PAYMENT_METHOD_NAME: 'untokenized',
    TOKENIZED_PAYMENT_METHOD_NAME: 'tokenized',
    CREDIT_CARD_PAYMENT_METHOD_NAME: 'credit_card'
};
