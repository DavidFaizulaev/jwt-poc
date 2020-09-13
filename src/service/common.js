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
    HDR_X_CLIENT_IP_ADDRESS: 'x-client-ip-address',
    HDR_X_ZOOZ_API_PROXY_VERSION: 'x-zooz-risk-proxy-api-version',

    // Payment states
    NOT_VALID_STATE: 'not_valid',
    INITIAL_STATE: 'payment_initial',
    AUTHORIZED: 'authorized',

    // Conflict errors
    PAYMENT_CONFLICT: 'Please check the current state of the payment.',
    PAYMENT_CONFLICT_DESCRIPTION: 'There was conflict with payment resource current state.',
    // Payment resource bad request errors
    PAYMENT_TOO_MANY_ACTIONS: 'Too many actions were made on this payment. Number of actions allowed: ',
    // payment method token state errors
    TOKEN_USED_ERROR: 'This token has already been used in a successful payment. Make sure the customer has given his consent to use his details again.',
    TOKEN_NOT_EXIST_ERROR: 'Token does not exist.',
    TOKEN_PENDING_ERROR: 'Token under status pending cannot be used, please activate the token in order to use it',
    TOKEN_FAILED_ERROR: 'Token cannot be used as token activation failed',
    TOKEN_CANCELED_ERROR: 'This token cannot be used as it was cancelled by the merchant',
    // Payment Not found error
    APP_ID_OF_PAYMENT_NOT_FOUND: 'App_id that is related to the payment was not found',

    // Header errors
    ACCEPT_HEADER_INVALID: 'accept should be */* or application/json',
    CONTENT_TYPE_HEADER_INVALID: 'content-type should be application/json',
    CONTENT_TYPE_HEADER_MISSING: 'content-type is missing and should be application/json',
    CHARSET_HEADER_INVALID: 'content-type charset should be utf-8',
    API_VERSION_INVALID: 'API version is not supported',
    // FSS
    CREDIT_CARD_FSS_PAYMENT_METHOD_NAME: 'CreditCard',
    UNTOKENIZED_PAYMENT_METHOD_NAME: 'untokenized',
    TOKENIZED_PAYMENT_METHOD_NAME: 'tokenized',
    CREDIT_CARD_PAYMENT_METHOD_NAME: 'credit_card',
    // payment method token states
    EXPIRED_STATE_NAME: 'expired',
    USED_STATE_NAME: 'used',
    PENDING_STATE_NAME: 'pending',
    FAILED_STATE_NAME: 'failed',
    CANCELED_STATE_NAME: 'canceled',

    // PAYMENT STORAGE ERROR MAPPINGS
    PAYMENT_STORAGE_ERROR_MAPPINGS: {
        INVALID_PAYMENT_ID_ERROR_CODE: 'InvalidPaymentId',
        PAYMENT_NOT_FOUND_ERROR_CODE: 'PaymentNotFound',
        ACTION_NOT_FOUND_ERROR_CODE: 'ActionNotFound'
    },

    SERVICE_UNAVAILABLE_DESCRIPTION: 'Unable to reach the provider network.',
    SERVICE_UNAVAILABLE_CATEGORY: 'provider_network_error'
};
