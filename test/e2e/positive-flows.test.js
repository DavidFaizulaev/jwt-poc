const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const bunyan = require('bunyan');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');
const commonSnips = require('../helpers/snips');

const { fullRiskRequestBody } = commonSnips;

const createLogger = () => {
    return bunyan.createLogger({
        name: 'Positive flows',
        src: false,
        streams: [
            {
                level: 'info',
                stream: process.stdout
            },
            {
                level: 'error',
                stream: process.stderr
            }
        ]
    });
};

const sdkConfigurationPreparations = {
    API_VERSION,
    PAYMENTSOS_URL: PAYMENTS_OS_BASE_URL,
    PAYMENTSOS_ENV: EXTERNAL_ENVIRONMENT,
    LOGGER: createLogger()
};

let paymentMethodToken;

describe('Create risk analyses flows', function () {
    let testsEnvs, paymentObject;
    before(async function(){
        paymentsOSClient.init({
            BASE_URL: PAYMENTS_OS_BASE_URL,
            env: EXTERNAL_ENVIRONMENT,
            origin: ORIGIN_URL
        });
        paymentsOSsdkClient.init(sdkConfigurationPreparations, false);

        testsEnvs = await environmentPreparations.prepareTestEnvironment(paymentsOSClient, paymentsOSsdkClient, RISK_PROVIDER_CONFIGURATION);

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

        Object.assign(sdkConfigurationPreparations, {
            APP_ID: testsEnvs.application.id,
            PUBLIC_KEY: testsEnvs.app_keys[1].key,
            PRIVATE_KEY: testsEnvs.app_keys[0].key
        });

        await paymentsOSsdkClient.init(sdkConfigurationPreparations, false);

        paymentMethodToken = await environmentPreparations.preparePaymentMethodToken(paymentsOSsdkClient);

        console.log('successfully created payment method token');

        const genericAddress = environmentPreparations.generateGenericAddress(paymentsOSsdkClient);

        const createPaymentRequest = {
            amount: 500,
            currency: 'PLN',
            shipping_address: genericAddress,
            billing_address: genericAddress
        };

        const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
        paymentObject = createPaymentResponse.body;
        console.log('successfully created payment');

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
    });

    describe('Successfully create risk resource with tokenized payment_method', function () {
        let createRiskResponse;
        it('Should successfully create risk resource', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: paymentMethodToken.token };
            createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(createRiskResponse.statusCode).to.equal(201);
            expect(createRiskResponse.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data',
                'created', 'id', 'result');
            expect(createRiskResponse.body.payment_method).to.have.all.keys('type', 'holder_name', 'last_4_digits', 'pass_luhn_validation',
                'fingerprint', 'created', 'token', 'token_type', 'billing_address', 'bin_number', 'card_type', 'country_code', 'expiration_date',
                'issuer', 'level', 'vendor');
            expect(createRiskResponse.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should get risk resource by id', async function () {
            const response = await paymentsOSsdkClient.getRiskAnalysesByRiskAnalysesId({
                payment_id: paymentObject.id, risk_analyses_id: createRiskResponse.body.id
            });
            expect(response.statusCode).to.equal(200);
            const riskAnalysesResource = response.body;
            expect(riskAnalysesResource.id).to.equal(createRiskResponse.body.id);
            expect(riskAnalysesResource).to.have.all.keys('action_time', 'action_type', 'payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'id', 'last_update_action_time', 'result_data', 'save_time', 'x_zooz_request_id');
            expect(riskAnalysesResource.payment_method).to.have.all.keys('billing_address', 'id', 'credit_card', 'created_timestamp', 'last_used_timestamp', 'payment_method_token', 'payment_method_type', 'type');
            expect(riskAnalysesResource.result_data).to.eql({ status: 'Succeed' });
        });
        it('Should successfully create risk resource with untokenized payment method', async function () {
            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);
            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('expiration_date', 'type', 'holder_name', 'last_4_digits', 'pass_luhn_validation', 'fingerprint', 'created', 'source_type');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should successfully get all risk resources', async function () {
            const response = await paymentsOSsdkClient.getAllRiskAnalyses({ payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(200);
            expect(response.body.length).to.equal(2);
        });
    });
    describe('Create risk resource with minimal requests and fields', function () {
        before(async function(){
            paymentObject = await localPrep();
        });
        it.skip('Should successfully create risk resource with minimal request body (no request body)', async function () {
            // flow not yet supported by feedzai, as payment method is expected
            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: {}, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('credit_card', 'type', 'source_type');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should successfully create risk resource without sending transaction_type', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.transaction_type;

            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'pass_luhn_validation', 'last_4_digits');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should successfully create risk resource without sending session_id', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.session_id;

            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'pass_luhn_validation', 'last_4_digits');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should successfully create risk resource without sending device_id', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.device_id;

            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'pass_luhn_validation', 'last_4_digits');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it('Should successfully create risk resource without sending merchant', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.merchant;

            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'last_4_digits', 'pass_luhn_validation');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
        it.skip('Should successfully create risk resource without sending payment method', async function () {
            // flow not yet supported by feedzai
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.payment_method;

            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(response.body.payment_method).to.have.all.keys('credit_card', 'type', 'source_type');
            expect(response.body.result).to.eql({ status: 'Succeed' });
        });
    });
});

async function localPrep () {
    const genericAddress = environmentPreparations.generateGenericAddress(paymentsOSsdkClient);

    const createPaymentRequest = {
        amount: 500,
        currency: 'USD',
        shipping_address: genericAddress,
        billing_address: genericAddress
    };

    testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);
    const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
    const paymentObject = createPaymentResponse.body;

    console.log('successfully created payment');
    testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);

    return paymentObject;
}