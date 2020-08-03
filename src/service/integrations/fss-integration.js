const { get } = require('lodash');
const { HttpMetricsCollector } = require('prometheus-api-metrics');
const { OK, BAD_REQUEST, NOT_FOUND } = require('http-status-codes');
const fss = require('fss-integration').fss;
const { FSS_URL, FSS_USERNAME, FSS_PASSWORD, FSS_REFRESH_TOKEN_INTERVAL, APP_NAME, SOUTHBOUND_BUCKETS, DEFAULT_REQUEST_RETRIES } = require('../config');
const { logger } = require('../logger');
const {
    CREDIT_CARD_FSS_PAYMENT_METHOD_NAME, UNTOKENIZED_PAYMENT_METHOD_NAME, CREDIT_CARD_PAYMENT_METHOD_NAME,
    EXPIRED_STATE_NAME, USED_STATE_NAME, PENDING_STATE_NAME, CANCELED_STATE_NAME, FAILED_STATE_NAME,
    TOKEN_NOT_EXIST_ERROR, TOKEN_USED_ERROR, TOKEN_PENDING_ERROR, TOKEN_CANCELED_ERROR, TOKEN_FAILED_ERROR
} = require('../common');
const { handleIntegrationError } = require('./helpers/integration-error-handler');
const { formatDate } = require('../commonFunctions');

HttpMetricsCollector.init({ durationBuckets: SOUTHBOUND_BUCKETS });

const fssCreatePaymentMethodMetricsPath = { target: FSS_URL, route: '/merchants/:merchant_id/payment-methods' };
let initialized = false;

const fssIntegrationOptions = {
    logger,
    keep_alive: true,
    url: FSS_URL,
    fss_username: FSS_USERNAME,
    fss_password: FSS_PASSWORD,
    retry_interval: FSS_REFRESH_TOKEN_INTERVAL,
    instance_name: APP_NAME,
    service_name: APP_NAME,
    max_retries: DEFAULT_REQUEST_RETRIES + 1
};

async function loginToFss() {
    if (!initialized) {
        await fss.init(fssIntegrationOptions);
        initialized = true;
    }
}

async function handlePaymentMethodToken(merchantId, paymentMethodDetails, headers) {
    if (isUntokenizedCreditCardRequest(paymentMethodDetails)) {
        const createPaymentMethodResponse = await createPaymentMethod(merchantId, paymentMethodDetails, headers);
        createPaymentMethodResponse.payment_method_details.token = createPaymentMethodResponse.payment_method_token;
        createPaymentMethodResponse.payment_method_details.type = 'tokenized';
        return createPaymentMethodResponse.payment_method_details;
    } else if (paymentMethodDetails) {
        await validateTokenState(merchantId, paymentMethodDetails, headers);
    }
    return paymentMethodDetails;
}

function isUntokenizedCreditCardRequest(paymentMethod) {
    const isUntokenized = get(paymentMethod, 'type') === UNTOKENIZED_PAYMENT_METHOD_NAME;
    const isCreditCard = get(paymentMethod, 'source_type') === CREDIT_CARD_PAYMENT_METHOD_NAME;
    const isWithFullNumber = get(paymentMethod, 'card_number');

    return isUntokenized && isCreditCard && isWithFullNumber;
}

async function createPaymentMethod(merchantId, paymentMethodDetails, headers) {
    const requestBody = createPaymentMethodRequestBody(paymentMethodDetails);
    const createPaymentMethodResponse = await fss.createPaymentMethod(merchantId, requestBody, headers);
    collectSouthboundMetrics(createPaymentMethodResponse, HttpMetricsCollector, fssCreatePaymentMethodMetricsPath);
    if (createPaymentMethodResponse.statusCode !== OK) {
        handleIntegrationError(createPaymentMethodResponse);
    }

    return createPaymentMethodResponse.body;
}

function createPaymentMethodRequestBody(paymentMethodDetails) {
    const validatedExpirationDate = formatDate(paymentMethodDetails);
    const requestBody = {
        payment_method_details: {
            payment_method_type: CREDIT_CARD_FSS_PAYMENT_METHOD_NAME,
            card_holder_name: paymentMethodDetails.holder_name,
            expiration_date: validatedExpirationDate,
            card_number: paymentMethodDetails.card_number,
            card_identity: paymentMethodDetails.card_identity
        },
        additional_details: { zooz_internal_token: 'true' }
    };
    return requestBody;
}

function collectSouthboundMetrics(requestObject, httpMetricsCollector, requestPath) {
    requestObject.request.metrics = requestPath;
    httpMetricsCollector.collect(requestObject);
}

async function validateTokenState(merchantId, paymentMethodDetails, headers) {
    let notValidStateErrorMessage;
    const paymentMethodToken = paymentMethodDetails.token;
    const getPaymentMethodResponse = await fss.getPaymentMethod({ merchant_id: merchantId, payment_method_token: paymentMethodToken, headers });

    if (getPaymentMethodResponse.statusCode === NOT_FOUND) {
        notValidStateErrorMessage = TOKEN_NOT_EXIST_ERROR;
    } else {
        const paymentMethodState = get(getPaymentMethodResponse, 'body.payment_method_state.current_state');
        switch (paymentMethodState) {
        case EXPIRED_STATE_NAME:
            notValidStateErrorMessage = TOKEN_NOT_EXIST_ERROR;
            break;
        case USED_STATE_NAME:
            notValidStateErrorMessage = TOKEN_USED_ERROR;
            break;
        case PENDING_STATE_NAME:
            notValidStateErrorMessage = TOKEN_PENDING_ERROR;
            break;
        case CANCELED_STATE_NAME:
            notValidStateErrorMessage = TOKEN_CANCELED_ERROR;
            break;
        case FAILED_STATE_NAME:
            notValidStateErrorMessage = TOKEN_FAILED_ERROR;
            break;
        }
    }

    if (notValidStateErrorMessage) {
        const notValidStateError = {
            statusCode: BAD_REQUEST,
            more_info: notValidStateErrorMessage
        };
        throw notValidStateError;
    }
}

module.exports = {
    loginToFss: loginToFss,
    handlePaymentMethodToken: handlePaymentMethodToken
};
