const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const bunyan = require('bunyan');
const axios = require('axios');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { SensitiveFieldValues } = require('sensitive-field-values');
const fs = require('fs');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');
const commonSnips = require('../helpers/snips');

const { fullRiskRequestBody } = commonSnips;
const sensitiveFieldValues = new SensitiveFieldValues();

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

        const createPaymentResponse = await paymentsOSsdkClient.postPayments({request_body: createPaymentRequest});
        paymentObject = createPaymentResponse.body;
        console.log('successfully created payment');

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
    });

    describe('Successfully create risk resource with tokenized and untokenized payment_method', function () {
        let createRiskResponse;
        it('Should successfully create risk resource', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = {
                token: paymentMethodToken.token,
                type: 'tokenized'
            };
            createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: copiedRequestBody,
                payment_id: paymentObject.id
            });
            expect(createRiskResponse.statusCode).to.equal(201);

            const createRiskAnalysesResource = createRiskResponse.body;
            expect(createRiskAnalysesResource).to.have.all.keys('payment_method', 'provider_configuration', 'session_id', 'device_id', 'provider_data',
                'created', 'id', 'result');
            expect(createRiskAnalysesResource.payment_method).to.have.all.keys('type', 'holder_name', 'last_4_digits', 'pass_luhn_validation',
                'fingerprint', 'created', 'token', 'token_type', 'billing_address', 'bin_number', 'card_type', 'country_code', 'expiration_date',
                'issuer', 'level', 'vendor');
            expect(createRiskAnalysesResource.result).to.eql({status: 'Succeed'});
            validateSelfHeader(createRiskResponse, paymentObject);

            expect(createRiskAnalysesResource.device_id).to.equal(copiedRequestBody.device_id);
            expect(createRiskAnalysesResource.session_id).to.equal(copiedRequestBody.session_id);

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: createRiskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(copiedRequestBody);
        });
        it('Should get risk resource by id', async function () {
            const response = await paymentsOSsdkClient.getRiskAnalysesByRiskAnalysesId({
                payment_id: paymentObject.id, risk_analyses_id: createRiskResponse.body.id
            });
            expect(response.statusCode).to.equal(200);
            const riskAnalysesResource = response.body;
            expect(riskAnalysesResource.id).to.equal(createRiskResponse.body.id);
            expect(riskAnalysesResource).to.have.all.keys('created', 'payment_method', 'provider_configuration', 'session_id', 'device_id', 'provider_data', 'id', 'result');
            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});
            validateSelfHeader(response, paymentObject);
            expect({
                path: '/payments/{payment_id}/risk-analyses/{risk_analyses_id}',
                status: 200,
                method: 'get',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
        it('Should successfully create risk resource with untokenized payment method', async function () {
            createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: fullRiskRequestBody,
                payment_id: paymentObject.id
            });
            expect(createRiskResponse.statusCode).to.equal(201);
            expect(createRiskResponse.body).to.have.all.keys('payment_method', 'provider_configuration', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(createRiskResponse.body.payment_method).to.have.all.keys('expiration_date', 'type', 'holder_name', 'last_4_digits', 'pass_luhn_validation', 'fingerprint', 'created', 'source_type');
            expect(createRiskResponse.body.result).to.eql({status: 'Succeed'});
            validateSelfHeader(createRiskResponse, paymentObject);
            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: createRiskResponse,
                headers: {}
            }).to.matchApiSchema();

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(fullRiskRequestBody);
        });
        it('Should successfully get all risk resources', async function () {
            const response = await paymentsOSsdkClient.getAllRiskAnalyses({payment_id: paymentObject.id});
            expect(response.statusCode).to.equal(200);
            expect(response.body.length).to.equal(2);
            const risksHeaders = response.headers;
            expect(risksHeaders).to.contain.keys('self');
            expect(risksHeaders.self).to.equal(`${PAYMENTS_OS_BASE_URL}/payments/${paymentObject.id}/risk-analyses`);
            expect({
                path: '/payments/{payment_id}/risk-analyses/',
                status: 200,
                method: 'get',
                body: response.body,
                headers: {}
            }).to.matchApiSchema();
        });
    });
    describe('Create risk resource with minimal requests and fields', function () {
        before(async function () {
            paymentObject = await localPrep();
        });
        it.skip('Should successfully create risk resource with minimal request body (no request body)', async function () {
            // TODO: pending payu risk fix - make sure the test is good and validating the relevant s
            const response = await paymentsOSsdkClient.postRiskAnalyses({ request_body: {}, payment_id: paymentObject.id });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('provider_data', 'created', 'id', 'result', 'provider_configuration');
            expect(response.body.payment_method).to.have.all.keys('type', 'source_type');
            expect(response.body.result).to.eql({status: 'Succeed'});
        });
        it('Should successfully create risk resource without sending session_id', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.session_id;

            const createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: copiedRequestBody,
                payment_id: paymentObject.id
            });
            expect(createRiskResponse.statusCode).to.equal(201);

            const riskAnalysesResource = createRiskResponse.body;
            expect(riskAnalysesResource).to.have.all.keys('payment_method', 'provider_configuration', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(riskAnalysesResource.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'pass_luhn_validation', 'last_4_digits');
            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(copiedRequestBody);
        });
        it('Should successfully create risk resource without sending device_id', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.device_id;

            const createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: copiedRequestBody,
                payment_id: paymentObject.id
            });
            expect(createRiskResponse.statusCode).to.equal(201);

            const riskAnalysesResource = createRiskResponse.body;
            expect(riskAnalysesResource).to.have.all.keys('payment_method', 'provider_configuration', 'session_id', 'provider_data', 'created', 'id', 'result');
            expect(riskAnalysesResource.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'pass_luhn_validation', 'last_4_digits');
            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(copiedRequestBody);
        });
        it('Should successfully create risk resource without sending merchant', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.merchant;

            const createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: copiedRequestBody,
                payment_id: paymentObject.id
            });
            expect(createRiskResponse.statusCode).to.equal(201);

            const riskAnalysesResource = createRiskResponse.body;
            expect(riskAnalysesResource).to.have.all.keys('payment_method', 'provider_configuration', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result');
            expect(riskAnalysesResource.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'last_4_digits', 'pass_luhn_validation');
            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(copiedRequestBody);
        });
        it.skip('Should successfully create risk resource without sending payment method', async function () {
            // TODO: pending payu risk fix
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            delete copiedRequestBody.payment_method;

            const response = await paymentsOSsdkClient.postRiskAnalyses({
                request_body: copiedRequestBody,
                payment_id: paymentObject.id
            });
            expect(response.statusCode).to.equal(201);

            expect(response.body).to.have.all.keys('session_id', 'device_id', 'provider_data', 'created', 'id', 'result', 'provider_configuration');
            expect(response.body.payment_method).to.have.all.keys('credit_card', 'type', 'source_type');
            expect(response.body.result).to.eql({status: 'Succeed'});

            sensitiveFieldValues.addExternalCreateRiskAnalysisRequest(copiedRequestBody);
        });
    });
    describe('Headers validations', function () {
        before(async function () {
            paymentObject = await localPrep();
        });
        let riskResourceId;
        it('Should successfully create when request is sent with content-type and charset and accept', async () => {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({baseURL: createRiskRequestComplete.url});
            const createRiskResponse = await client(createRiskRequestComplete);
            expect(createRiskResponse.status).to.equal(201);

            const riskAnalysesResource = createRiskResponse.data;
            riskResourceId = riskAnalysesResource.id;
            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});
            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 201,
                method: 'post',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
        it('Should successfully get risk by id when request is sent with content-type, accept and charset', async () => {
            const getRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses/${riskResourceId}`,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'GET'
            };
            const client = axios.create({ baseURL: getRiskRequestComplete.url });
            const riskResponse = await client(getRiskRequestComplete);
            expect(riskResponse.status).to.equal(200);

            const riskAnalysesResource = riskResponse.data;

            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});
            expect({
                path: '/payments/{payment_id}/risk-analyses/{risk_analyses_id}',
                status: 200,
                method: 'get',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
        it('Should successfully get risk by id when request is sent without content-type and charset', async () => {
            const getRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses/${riskResourceId}`,
                headers: {
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'GET'
            };
            const client = axios.create({ baseURL: getRiskRequestComplete.url });
            const riskResponse = await client(getRiskRequestComplete);
            expect(riskResponse.status).to.equal(200);

            const riskAnalysesResource = riskResponse.data;

            expect(riskAnalysesResource.result).to.eql({status: 'Succeed'});
            expect({
                path: '/payments/{payment_id}/risk-analyses/{risk_analyses_id}',
                status: 200,
                method: 'get',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
        it('Should successfully get all risks when request is sent with content-type, accept and charset', async () => {
            const getRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'GET'
            };
            const client = axios.create({ baseURL: getRiskRequestComplete.url });
            const riskResponse = await client(getRiskRequestComplete);
            expect(riskResponse.status).to.equal(200);

            const riskAnalysesResource = riskResponse.data;
            expect(riskAnalysesResource.length).to.equal(1);

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 200,
                method: 'get',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
        it('Should successfully get all risks when request is sent without content-type and charset', async () => {
            const getRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'GET'
            };
            const client = axios.create({ baseURL: getRiskRequestComplete.url });
            const riskResponse = await client(getRiskRequestComplete);
            expect(riskResponse.status).to.equal(200);

            const riskAnalysesResource = riskResponse.data;
            expect(riskAnalysesResource.length).to.equal(1);

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 200,
                method: 'get',
                body: riskAnalysesResource,
                headers: {}
            }).to.matchApiSchema();
        });
    });
    describe('Data sentry prep', function () {
        it('Storing sensitive values for data sentry', async function () {
            let sensitiveValuesArray = Array.from(sensitiveFieldValues.getSensitiveFieldValues());
            sensitiveValuesArray = [...sensitiveValuesArray].join('\n');

            if (!await fs.existsSync('logs')) {
                fs.mkdirSync('logs');
            }
            await fs.appendFileSync('logs/data-sentry-values.txt', sensitiveValuesArray, 'utf8');
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

function validateSelfHeader(riskResponse, paymentObject) {
    const riskAnalysesResource = riskResponse.body;
    const riskHeaders = riskResponse.headers;
    expect(riskHeaders).to.contain.keys('self');
    expect(riskHeaders.self).to.equal(`${PAYMENTS_OS_BASE_URL}/payments/${paymentObject.id}/risk-analyses/${riskAnalysesResource.id}`);
}
