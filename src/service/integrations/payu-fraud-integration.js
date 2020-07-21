const { cloneDeep } = require('lodash');
const uuid = require('uuid');
const { HttpMetricsCollector } = require('prometheus-api-metrics');
const { TOKENIZED_PAYMENT_METHOD_NAME, UNTOKENIZED_PAYMENT_METHOD_NAME, CREDIT_CARD_PAYMENT_METHOD_NAME, HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_IDEPMOTENCY } = require('../common');
const requestHelper = require('../request-sender');
const { SOUTHBOUND_BUCKETS, FRAUD_SERVICE_URL, ENVIRONMENT, FEEDZAI_SERVICE_NAME } = require('../config');
const { handleIntegrationError } = require('./helpers/integration-error-handler');
HttpMetricsCollector.init({ durationBuckets: SOUTHBOUND_BUCKETS });

const createRiskMetricsPath = { target: FRAUD_SERVICE_URL, route: '/payments/:payment_id/risk-analyses' };
const TARGET_NAME = 'risk_provider';

module.exports = {
    createRisk: createRisk
};

async function createRisk(paymentResource, requestBody, headers, providerConfigurationId, paymentMethod) {
    const body = buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod);
    const reqHeaders = {
        [HDR_X_ZOOZ_IDEPMOTENCY]: headers[HDR_X_ZOOZ_IDEPMOTENCY] || uuid.v4(),
        [HDR_X_ZOOZ_REQUEST_ID]: headers[HDR_X_ZOOZ_REQUEST_ID]
    };
    const requestOptions = {
        url: buildRequestUrl(paymentResource.id),
        data: body,
        headers: reqHeaders,
        method: 'post',
        targetName: TARGET_NAME
    };
    let fraudResponse;
    try {
        fraudResponse = await requestHelper.sendRequest(requestOptions);
    } catch (error) {
        handleIntegrationError(error.response || error);
    }
    collectSouthboundMetrics(fraudResponse, HttpMetricsCollector, createRiskMetricsPath);
    const mappedFraudResponse = handleResponse(fraudResponse.data);
    return mappedFraudResponse;
}

function buildRequestUrl(paymentId) {
    const baseUrl = FRAUD_SERVICE_URL.replace('{SERVICE_NAME}', `${ENVIRONMENT}-${FEEDZAI_SERVICE_NAME}`);
    return `${baseUrl}/payments/${paymentId}/risk-analyses`;
}

function handleResponse(fraudResponse) {
    const paymentMethod = mapPaymentMethodFromResponse(fraudResponse.payment_method, {}, {}); // TODO: use enteties mapper
    const responseToMerchant = {
        payment_method: paymentMethod,
        transaction_type: fraudResponse.transaction_type,
        session_id: fraudResponse.session_id,
        device_id: fraudResponse.device_id,
        merchant: fraudResponse.merchant,
        result: fraudResponse.result_data,
        provider_configuration: fraudResponse.provider_configuration,
        provider_data: fraudResponse.provider_data,
        ip_address: fraudResponse.ip_address,
        additional_details: fraudResponse.additional_details,
        created: fraudResponse.action_time,
        id: fraudResponse.id
    };
    return responseToMerchant;
}

function mapPaymentMethodFromResponse(responsePaymentMethod, headers, context) {
    let mappedResponse;

    if (responsePaymentMethod.type === TOKENIZED_PAYMENT_METHOD_NAME || responsePaymentMethod.payment_method_token) {
        mappedResponse = handleTokenizedPaymentMethod(responsePaymentMethod, headers, context);
    } else {
        mappedResponse = cloneDeep(responsePaymentMethod);

        delete mappedResponse.payment_method_type;
        mappedResponse.source_type = responsePaymentMethod.payment_method_type;
        mappedResponse.type = UNTOKENIZED_PAYMENT_METHOD_NAME;
    }

    return mappedResponse;
}

function handleTokenizedPaymentMethod(responsePaymentMethod, headers, context) {
    let mappedResponse;

    mappedResponse = getCreditCardStructure(responsePaymentMethod, headers, context);
    mappedResponse = mapCommonFields(mappedResponse, responsePaymentMethod);

    return mappedResponse;
}

function mapCommonFields(retPaymentMethod, paymentMethod) {
    if (paymentMethod.billing_address) {
        retPaymentMethod.billing_address = paymentMethod.billing_address;
        delete retPaymentMethod.billing_address.line3;
    }

    if (paymentMethod.customer_id) {
        retPaymentMethod.href = `https://api-qa.paymentsos.com/customers/${paymentMethod.customer_id}/payment_methods/${retPaymentMethod.token}`;
        retPaymentMethod.customer = `https://api-qa.paymentsos.com/customers/${paymentMethod.customer_id}`;
    }

    if (paymentMethod.created_timestamp) {
        retPaymentMethod.created = Date.parse(paymentMethod.created_timestamp).toString();
    }

    return retPaymentMethod;
}

function getCreditCardStructure(paymentMethod, headers, context) {
    const creditCardDetails = paymentMethod.credit_card || paymentMethod || {};
    const binDetails = paymentMethod.credit_card && (paymentMethod.credit_card.bin_details || paymentMethod.bin_details || {});

    const retPaymentMethod = {
        type: paymentMethod.type,
        token: paymentMethod.token,
        token_type: undefined,
        additional_details: paymentMethod.additional_details,
        holder_name: creditCardDetails.card_holder_name,
        expiration_date: creditCardDetails.expiration_date,
        last_4_digits: creditCardDetails.last_4_digits,
        pass_luhn_validation: creditCardDetails.is_luhn_valid,
        fingerprint: creditCardDetails.fingerprint,
        bin_number: binDetails.bin_number,
        vendor: binDetails.card_vendor,
        issuer: binDetails.card_issuer,
        card_type: binDetails.card_type,
        level: binDetails.card_level,
        identity_document: undefined,
        country_code: undefined,
        created: undefined,
        href: undefined,
        customer: undefined,
        billing_address: undefined,
        source_type: undefined
    };

    // Only true for get payment/authorize/charge requests (the response is from payment storage)
    if (paymentMethod.payment_method_token || paymentMethod.token) {
        retPaymentMethod.token_type = 'credit_card';
        retPaymentMethod.type = 'tokenized';
        retPaymentMethod.token = paymentMethod.payment_method_token || paymentMethod.token;
    }

    if (creditCardDetails.identity_document) {
        retPaymentMethod.identity_document = creditCardDetails.identity_document;
    }

    if (binDetails && binDetails.card_country_code) {
        retPaymentMethod.country_code = binDetails.card_country_code;
    }

    if ((paymentMethod.additional_details && paymentMethod.additional_details.zooz_internal_token === 'true') ||
        context.token_created_by_zooz) {
        delete retPaymentMethod.token_type;
        delete retPaymentMethod.token;
        if (retPaymentMethod.additional_details) {
            delete retPaymentMethod.additional_details.zooz_internal_token;
        }
        if (retPaymentMethod.additional_details && Object.keys(retPaymentMethod.additional_details).length === 0) {
            delete retPaymentMethod.additional_details;
        }
        retPaymentMethod.source_type = 'credit_card';
        retPaymentMethod.type = 'untokenized';
    }

    return retPaymentMethod;
}

function buildRequestBody(paymentResource, requestBody, providerConfigurationId, paymentMethod) {
    const copiedRequestBody = cloneDeep(requestBody);

    copiedRequestBody.payment_method = paymentMethod;

    if (!isUntokenizedCreditCardRequest(paymentMethod)) {
        copiedRequestBody.payment_method = {
            type: TOKENIZED_PAYMENT_METHOD_NAME,
            token: paymentMethod.token,
            credit_card_cvv: paymentMethod.credit_card_cvv
        };
    }

    return {
        risk_data: copiedRequestBody,
        payment_resource: paymentResource,
        provider_configuration_id: providerConfigurationId
    };
}

function isUntokenizedCreditCardRequest(paymentMethod) {
    return paymentMethod && paymentMethod.type === UNTOKENIZED_PAYMENT_METHOD_NAME &&
        paymentMethod.source_type === CREDIT_CARD_PAYMENT_METHOD_NAME;
}

function collectSouthboundMetrics(requestObject, httpMetricsCollector, requestPath) {
    requestObject.request.metrics = requestPath;
    httpMetricsCollector.collect(requestObject);
}
