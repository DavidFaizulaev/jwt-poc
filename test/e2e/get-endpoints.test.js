const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const uuid = require('uuid');
const bunyan = require('bunyan');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');

const createLogger = () => {
    return bunyan.createLogger({
        name: 'Get risk analyses resources tests',
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

const fullRiskRequestBody = {
    transaction_type: 'charge',
    payment_method: {
        type: 'untokenized',
        source_type: 'credit_card',
        holder_name: 'Dina Yakovlev',
        card_number: '123456789123',
        expiration_date: '12/20'
    },
    session_id: 'session_id',
    device_id: 'device_id',
    auth_check: 'auth_check',
    three_d_secure_check: 'three_d_secure_check',
    cvv_check: 'cvv_check',
    installments: {
        number_of_installments: 1
    },
    merchant: {
        mcc: '123'
    },
    acquirer: {
        id: 'id',
        country: 'USA'
    },
    provider_specific_data: {
        data: 'val'
    }
};

let paymentMethodToken;

describe('Testing get risk analyses resource requests', function () {
    this.timeout(1500000);
    let testsEnvs, paymentObject;
    before(async function(){
        paymentsOSClient.init({
            BASE_URL: PAYMENTS_OS_BASE_URL,
            env: EXTERNAL_ENVIRONMENT,
            origin: ORIGIN_URL
        });
        paymentsOSsdkClient.init(sdkConfigurationPreparations, false);

        testsEnvs = await environmentPreparations.prepareTestEnvironment(paymentsOSClient, paymentsOSsdkClient, RISK_PROVIDER_CONFIGURATION);

        await testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

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
    });

    describe('NEGATIVE', function() {
        before(async function(){
            await testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
        });
        describe('NEGATIVE: Failed attempts to create risk analyses resource', function () {
            it('Create risk with invalid payment method', async function () {
                const copiedRequestBody = cloneDeep(fullRiskRequestBody);
                delete copiedRequestBody.payment_method.card_number;
                try {
                    await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                    throw new Error('Should not get here');
                } catch (error) {
                    expect(error.statusCode).to.eql(400);
                    expect(error.message).to.eql('400 - {"category":"api_request_error","description":"One or more request parameters are invalid."}');
                    expect(error.error.category).to.eql('api_request_error');
                    expect(error.error.description).to.eql('One or more request parameters are invalid.');
                }
            });
        });
        describe('NEGATIVE: Failed attempts to get risk analyses resource', function () {
            it('Get all risk analyses on payment resource with no risk analyses on it', async function () {
                const response = await paymentsOSsdkClient.getAllRiskAnalyses({
                    payment_id: paymentObject.id
                });
                expect(response.statusCode).to.eql(200);
                expect(response.body).to.be.length(0);
            });
            it('Get with risk id that doesn\'t exists and payment id exists', async function () {
                try {
                    await paymentsOSsdkClient.getRiskAnalysesByRiskAnalysesId({
                        payment_id: paymentObject.id, risk_analyses_id: '22e97941-c0f1-41f6-986e-fc8f9f3a2217'
                    });
                    throw new Error('Error should have been thrown');
                } catch (error) {
                    expect(error.statusCode).to.equal(404);
                    expect(error.response.body).to.eql({
                        category: 'api_request_error',
                        description: 'The resource was not found.'
                    });
                }
            });
            it('Get all risk analyses with payment id that doesn\'t exist', async function () {
                try {
                    await paymentsOSsdkClient.getAllRiskAnalyses({
                        payment_id: uuid.v4()
                    });
                    throw new Error('Error should have been thrown');
                } catch (error) {
                    expect(error.statusCode).to.equal(404);
                    expect(error.response.body).to.eql({
                        category: 'api_request_error',
                        description: 'The resource was not found.'
                    });
                }
            });
        });
    });
    describe('Full flow -> First create several risk analyses resources then create get requests', function () {
        describe('POSITIVE: Risk resource created and retrieved successfully', function () {
            let createRiskResponse;
            it('Successfully create risk resource with tokenized payment_method', async function () {
                const copiedRequestBody = cloneDeep(fullRiskRequestBody);
                copiedRequestBody.payment_method = { token: paymentMethodToken.token };
                createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                expect(createRiskResponse.statusCode).to.eql(201);
                expect(createRiskResponse.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data',
                    'created', 'id', 'result');
                expect(createRiskResponse.body.payment_method).to.have.all.keys('type', 'holder_name', 'last_4_digits', 'pass_luhn_validation',
                    'fingerprint', 'created', 'token', 'token_type', 'billing_address', 'bin_number', 'card_type', 'country_code', 'expiration_date',
                    'issuer', 'level', 'vendor');
                expect(createRiskResponse.body.result).to.eql({ status: 'Succeed' });
            });
            it('Get risk resource by id', async function () {
                const response = await paymentsOSsdkClient.getRiskAnalysesByRiskAnalysesId({
                    payment_id: paymentObject.id, risk_analyses_id: createRiskResponse.body.id
                });
                expect(response.statusCode).to.eql(200);
                expect(response.body.id).to.eql(createRiskResponse.body.id);
            });
        });
        describe('POSITIVE: Risk resource created and retrieved all of the resources successfully', function () {
            it('Successfully create risk resource with untokenized payment method', async function () {
                const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: paymentObject.id });
                expect(response.statusCode).to.eql(201);
                expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
                expect(response.body.payment_method).to.have.all.keys('expiration_date', 'type', 'holder_name', 'last_4_digits', 'pass_luhn_validation', 'fingerprint', 'created', 'source_type');
                expect(response.body.result).to.eql({ status: 'Succeed' });
            });
            it('Successfully create risk resource with partial payment method', async function () {
                const copiedRequestBody = cloneDeep(fullRiskRequestBody);
                delete copiedRequestBody.payment_method.card_number;
                copiedRequestBody.payment_method.last_4_digits = '1234';
                copiedRequestBody.payment_method.bin_number = '123456';

                const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                expect(response.statusCode).to.eql(201);

                expect(response.body).to.have.all.keys('payment_method', 'transaction_type', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
                expect(response.body.payment_method).to.have.all.keys('credit_card', 'type', 'source_type');
                expect(response.body.result).to.eql({ status: 'Succeed' });
            });
            it('Get all risk resources', async function () {
                const response = await paymentsOSsdkClient.getAllRiskAnalyses({ payment_id: paymentObject.id });
                expect(response.statusCode).to.eql(200);
                expect(response.body.length).to.eql(3);
            });
        });
    });
});
