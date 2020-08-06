const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const uuid = require('uuid');
const bunyan = require('bunyan');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const axios = require('axios');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');
const commonSnips = require('../helpers/snips');

const { fullRiskRequestBody, MOCK_DECLINE_RESPONSE_EMAIL, MOCK_REVIEW_RESPONSE_EMAIL } = commonSnips;

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

describe('Create risk analyses resource negative tests', function () {
    let testsEnvs, paymentObject, genericAddress, createPaymentRequest;
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

        genericAddress = environmentPreparations.generateGenericAddress(paymentsOSsdkClient);

        createPaymentRequest = {
            amount: 5500,
            currency: 'PLN',
            shipping_address: genericAddress,
            billing_address: genericAddress
        };

        const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
        paymentObject = createPaymentResponse.body;
        console.log('successfully created payment');

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
    });

    it('Should return bad request response when trying to create risk analyses with non-existing payment method token', async function () {
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.payment_method = { token: uuid.v4(), type: 'tokenized' };
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(400);
            expect(error.response.body).to.eql({
                category: 'api_request_error',
                description: 'One or more request parameters are invalid.',
                more_info: 'Token does not exist.'
            });
        }
    });
    it('Should return bad request response when create risk analyses is sent with invalid payment method expiration_date', async function () {
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.payment_method.expiration_date = '12]09';
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(400);
            const errorResponse = error.response.body;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
        }
    });
    it('Should return bad request response when to create risk analyses with invalid payment method source_type', async function () {
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.payment_method.source_type = 'invalid_source_type';
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(400);
            expect(error.message).to.equal('400 - {"category":"api_request_error","description":"One or more request parameters are invalid."}');
            expect(error.error.category).to.equal('api_request_error');
            expect(error.error.description).to.equal('One or more request parameters are invalid.');
        }
    });
    it('Should return bad request response when to create risk analyses with merchant_country_code exceeding 3 chars', async function () {
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.merchant.merchant_country_code = 'VVVV';
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(400);
            expect(error.message).to.equal('400 - {"category":"api_request_error","description":"One or more request parameters are invalid."}');
            expect(error.error.category).to.equal('api_request_error');
            expect(error.error.description).to.equal('One or more request parameters are invalid.');
        }
    });
    it('Should return not found response when trying to create risk analyses with non-existing payment id', async function () {
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: uuid.v4() });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(404);
            expect(error.message).to.equal('404 - {"category":"api_request_error","description":"The resource was not found."}');
            expect(error.error.category).to.equal('api_request_error');
            expect(error.error.description).to.equal('The resource was not found.');
        }
    });
    it('Should return bad request response when send malformed json', async function () {
        try {
            await paymentsOSsdkClient.postRiskAnalyses({ request_body: 'malformed json', payment_id: paymentObject.id });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(400);
            expect(error.message).to.equal('400 - {"more_info":"Request body must be valid json","category":"api_request_error","description":"One or more request parameters are invalid."}');
            expect(error.error.category).to.equal('api_request_error');
            expect(error.error.description).to.equal('One or more request parameters are invalid.');
            expect(error.error.more_info).to.equal('Request body must be valid json');
        }
    });
    it('Should return 400 with when request is sent with non supported content-type', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json1',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('content-type should be application/json');
        }
    });
    it('Should return 400 with when request is sent without content-type and charset', async () => {
        const createRiskRequestComplete = {
            url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
            headers: {
                'app-id': testsEnvs.application.id,
                'api-version': API_VERSION,
                'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                private_key: testsEnvs.app_keys[0].key
            },
            method: 'POST'
        };
        try {
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('content-type should be application/json');

            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 400,
                method: 'post',
                body: errorResponse,
                headers: {}
            }).to.matchApiSchema();
        }
    });
    it('Should return 400 with when request is sent with non supported accept', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/xml',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('accept should be */* or application/json');
        }
    });
    it('Should return 400 with when request is sent with non supported charset', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json;charset=ISO-8859-1',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('content-type charset should be utf-8');
        }
    });
    it('Should return 400 with when request is sent with non supported api version', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': '1.2.0',
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('API version is not supported');
        }
    });
    it('Should return 400 with when request is sent with non supported api version and content-type', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json1',
                    'app-id': testsEnvs.application.id,
                    'api-version': '1.2.0',
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('content-type should be application/json,API version is not supported');
        }
    });
    it('Should return 400 with when request is sent with non supported api version, accept and content-type', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json1',
                    accept: 'application/xml',
                    'app-id': testsEnvs.application.id,
                    'api-version': '1.2.0',
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    private_key: testsEnvs.app_keys[0].key
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('content-type should be application/json,accept should be */* or application/json,API version is not supported');
        }
    });
    it('Should return 400 with when request is sent without private key', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('Missing private_key header');
        }
    });
    it('Should return 400 with when request is sent without private key but with authorization session token', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    authorization: `Bearer ${testsEnvs.merchant.session_token}`,
                    'x-zooz-account-id': testsEnvs.merchant.merchant_id,
                    'Content-Type': 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT
                },
                responseType: 'json',
                method: 'POST'
            };
            const client = axios.create({ baseURL: createRiskRequestComplete.url });
            await client(createRiskRequestComplete);
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.response.status).to.equal(400);
            const errorResponse = error.response.data;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('One or more request parameters are invalid.');
            expect(errorResponse.more_info).to.equal('Missing private_key header');
        }
    });
    it('Should decline risk analyses request when sending email - MOCK_DECLINE_RESPONSE_EMAIL', async function () {
        const genericAddress = paymentsOSsdkClient.createAddressObject({
            country: 'ISR',
            city: 'Tel-Aviv',
            line1: '10705 Old Mill Rd',
            line2: '10705 Old Mill Rd',
            zip_code: '1111',
            title: 'Mr',
            first_name: 'Gordon',
            last_name: 'Ramsey',
            phone: '095090941',
            email: MOCK_DECLINE_RESPONSE_EMAIL,
            state: 'SD'
        });

        const createPaymentRequest = {
            amount: 500,
            currency: 'USD',
            shipping_address: genericAddress,
            billing_address: genericAddress
        };

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

        const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
        paymentObject = createPaymentResponse.body;
        console.log('successfully created payment');

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);

        const createRiskAnalysesResponse = await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: paymentObject.id });
        expect(createRiskAnalysesResponse.statusCode).to.equal(201);

        const riskAnalysesResource = createRiskAnalysesResponse.body;
        expect(riskAnalysesResource).to.have.all.keys('payment_method', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result', 'provider_configuration');
        expect(riskAnalysesResource.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'last_4_digits', 'pass_luhn_validation');
        expect(riskAnalysesResource.result).to.eql({ status: 'Failed' });

        const providerData = riskAnalysesResource.provider_data;
        expect(providerData).to.have.all.keys('description', 'response_code', 'raw_response', 'provider_name', 'external_id', 'risk_analyses_result');
        expect(providerData.response_code).to.equal('decline');
        expect(providerData.provider_name).to.equal('PayU-Risk');

        expect({
            path: '/payments/{payment_id}/risk-analyses',
            status: 201,
            method: 'post',
            body: riskAnalysesResource,
            headers: {}
        }).to.matchApiSchema();
    });
    it('Should decline risk analyses request when sending email - MOCK_REVIEW_RESPONSE_EMAIL', async function () {
        const genericAddress = paymentsOSsdkClient.createAddressObject({
            country: 'ISR',
            city: 'Tel-Aviv',
            line1: '10705 Old Mill Rd',
            line2: '10705 Old Mill Rd',
            zip_code: '1111',
            title: 'Mr',
            first_name: 'Gordon',
            last_name: 'Ramsey',
            phone: '095090941',
            email: MOCK_REVIEW_RESPONSE_EMAIL,
            state: 'SD'
        });

        const createPaymentRequest = {
            amount: 500,
            currency: 'USD',
            shipping_address: genericAddress,
            billing_address: genericAddress
        };

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

        const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
        paymentObject = createPaymentResponse.body;
        console.log('successfully created payment');

        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);

        const createRiskAnalysesResponse = await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: paymentObject.id });
        expect(createRiskAnalysesResponse.statusCode).to.equal(201);

        const riskAnalysesResource = createRiskAnalysesResponse.body;
        expect(riskAnalysesResource).to.have.all.keys('payment_method', 'session_id', 'device_id', 'provider_data', 'created', 'id', 'result', 'provider_configuration');
        expect(riskAnalysesResource.payment_method).to.have.all.keys('created', 'type', 'source_type', 'expiration_date', 'fingerprint', 'holder_name', 'last_4_digits', 'pass_luhn_validation');
        expect(riskAnalysesResource.result).to.eql({ status: 'Pending' });

        const providerData = riskAnalysesResource.provider_data;
        expect(providerData).to.have.all.keys('description', 'response_code', 'raw_response', 'provider_name', 'external_id', 'risk_analyses_result');
        expect(providerData.response_code).to.equal('review');
        expect(providerData.provider_name).to.equal('PayU-Risk');

        expect({
            path: '/payments/{payment_id}/risk-analyses',
            status: 201,
            method: 'post',
            body: riskAnalysesResource,
            headers: {}
        }).to.matchApiSchema();
    });
    it('should return 404 - payment not found when create risk is called with app-id header different than payment app-id', async function () {
        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);
        const createApplicationResponse = await paymentsOSsdkClient.createApplication({
            app_name: `some_app_id${(new Date().getTime())}`,
            account_id: testsEnvs.merchant.merchant_id,
            default_provider: testsEnvs.configurations.id,
            description: 'some_app_description',
            session_token: testsEnvs.merchant.session_token
        });
        const getAppKeysResponse = await paymentsOSsdkClient.getApplicationKeys({
            app_name: createApplicationResponse.body.id,
            account_id: testsEnvs.merchant.merchant_id,
            session_token: testsEnvs.merchant.session_token
        });
        testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
        try {
            await paymentsOSsdkClient.postRiskAnalyses({
                payment_id: paymentObject.id,
                request_body: fullRiskRequestBody,
                is_internal: true,
                internal_headers: {
                    'private-key': getAppKeysResponse.body[0].key,
                    'app-id': createApplicationResponse.body.id
                }
            });
            throw new Error('Should have thrown error');
        } catch (error) {
            expect(error.statusCode).to.equal(404);
            const errorResponse = error.response.body;
            expect(errorResponse.category).to.equal('api_request_error');
            expect(errorResponse.description).to.equal('The resource was not found.');
            expect(errorResponse.more_info).to.equal('App_id that is related to the payment was not found');
            expect({
                path: '/payments/{payment_id}/risk-analyses',
                status: 404,
                method: 'post',
                body: errorResponse,
                headers: {}
            }).to.matchApiSchema();
        }
    });
    describe('payment state validation tests', function () {
        let paymentMethod, mockProcessorProviderId, payURiskProviderId, createConfigurationResponseMockProcessor, createConfigurationResponsePayuRisk, paymentStateValidationPaymentObject;
        before(async function () {
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);
            const createPaymentResponse = await paymentsOSsdkClient.postPayments({ request_body: createPaymentRequest });
            paymentStateValidationPaymentObject = createPaymentResponse.body;
            console.log('successfully created payment');
            mockProcessorProviderId = await paymentsOSsdkClient.getProviderId({
                processor: 'processor',
                provider_name: 'MockProcessor',
                session_token: testsEnvs.merchant.session_token
            });
            payURiskProviderId = await paymentsOSsdkClient.getProviderId({
                provider_type: 'risk_provider',
                processor: 'processor',
                provider_name: 'PayU-Risk',
                session_token: testsEnvs.merchant.session_token
            });
            createConfigurationResponseMockProcessor = await paymentsOSsdkClient.createConfiguration({
                account_id: testsEnvs.merchant.merchant_id,
                session_token: testsEnvs.merchant.session_token,
                provider_id: mockProcessorProviderId,
                configuration_data: {
                },
                name: `mynameis${(new Date().getTime())}`
            });
            createConfigurationResponsePayuRisk = await paymentsOSsdkClient.createConfiguration({
                account_id: testsEnvs.merchant.merchant_id,
                session_token: testsEnvs.merchant.session_token,
                provider_id: payURiskProviderId,
                configuration_data: {
                    name: 'merchant_key',
                    tenant_id: 'payu',
                    region: 'latam',
                    isRequired: true,
                    isHidden: false,
                    description: 'key used to identify the merchant in the fraud system'
                },
                name: `mynameis${(new Date().getTime())}`
            });
        });
        it('should successfully create risk resource', async function () {
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);

            const createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                payment_id: paymentStateValidationPaymentObject.id,
                request_body: fullRiskRequestBody
            });
            expect(createRiskResponse.statusCode).to.equal(201);
            const createRiskAnalysesResource = createRiskResponse.body;
            expect(createRiskAnalysesResource.result).to.eql({ status: 'Succeed' });
            expect(createRiskAnalysesResource.device_id).to.equal(fullRiskRequestBody.device_id);
            expect(createRiskAnalysesResource.session_id).to.equal(fullRiskRequestBody.session_id);
        });
        it('should successfully authorize payment', async function () {
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

            await paymentsOSsdkClient.updateApplication({
                app_name: testsEnvs.application.id,
                account_id: testsEnvs.merchant.merchant_id,
                default_provider: createConfigurationResponseMockProcessor.body.id,
                description: 'some_app_description',
                session_token: testsEnvs.merchant.session_token
            });

            const genericAddress = environmentPreparations.generateGenericAddress(paymentsOSsdkClient);

            const createPaymentMethodToken = {
                token_type: 'credit_card',
                holder_name: 'holder_name',
                expiration_date: '12/2025',
                card_number: '5105105105105111',
                billing_address: genericAddress
            };
            const tokenResponse = await paymentsOSsdkClient.createToken({ request_body: createPaymentMethodToken });

            paymentMethod = paymentsOSsdkClient.createPaymentMethodObject({ type: 'tokenized', token: tokenResponse.body.token, credit_card_cvv: '234', vendor: 'MASTERCARD' });

            const authorizeResponse = await paymentsOSsdkClient.postAuthorization({
                payment_id: paymentStateValidationPaymentObject.id,
                request_body: {
                    payment_method: paymentMethod
                }
            });
            expect(authorizeResponse.statusCode).to.equal(201);
            expect(authorizeResponse.body.result.status).to.equal('Succeed');
        });
        it('should successfully create risk resource', async function () {
            await paymentsOSsdkClient.updateApplication({
                app_name: testsEnvs.application.id,
                account_id: testsEnvs.merchant.merchant_id,
                default_provider: createConfigurationResponsePayuRisk.body.id,
                description: 'some_app_description',
                session_token: testsEnvs.merchant.session_token
            });
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
            const createRiskResponse = await paymentsOSsdkClient.postRiskAnalyses({
                payment_id: paymentStateValidationPaymentObject.id,
                request_body: fullRiskRequestBody
            });
            expect(createRiskResponse.statusCode).to.equal(201);
            const createRiskAnalysesResource = createRiskResponse.body;
            expect(createRiskAnalysesResource.result).to.eql({ status: 'Succeed' });
            expect(createRiskAnalysesResource.device_id).to.equal(fullRiskRequestBody.device_id);
            expect(createRiskAnalysesResource.session_id).to.equal(fullRiskRequestBody.session_id);
        });
        it('should successfully capture payment', async function () {
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL);

            await paymentsOSsdkClient.updateApplication({
                app_name: testsEnvs.application.id,
                account_id: testsEnvs.merchant.merchant_id,
                default_provider: createConfigurationResponseMockProcessor.body.id,
                description: 'some_app_description',
                session_token: testsEnvs.merchant.session_token
            });
            const captureResponse = await paymentsOSsdkClient.postCapture({ payment_id: paymentStateValidationPaymentObject.id });
            expect(captureResponse.statusCode).to.equal(201);
            const captureResponseBody = captureResponse.body;
            expect(captureResponseBody.result.status).to.equal('Succeed');
        });
        it('should return 409 when create risk is applied to a captured payment', async function () {
            await paymentsOSsdkClient.updateApplication({
                app_name: testsEnvs.application.id,
                account_id: testsEnvs.merchant.merchant_id,
                default_provider: createConfigurationResponsePayuRisk.body.id,
                description: 'some_app_description',
                session_token: testsEnvs.merchant.session_token
            });
            testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, PAYMENTS_OS_BASE_URL_FOR_TESTS);
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: fullRiskRequestBody, payment_id: paymentStateValidationPaymentObject.id });
                throw new Error('Should have thrown error');
            } catch (error) {
                expect(error.statusCode).to.equal(409);
                const errorResponse = error.response.body;
                expect(errorResponse.category).to.equal('api_request_error');
                expect(errorResponse.description).to.equal('There was conflict with the resource current state.');
                expect(errorResponse.more_info).to.equal('There was conflict with payment resource current state.');
                expect({
                    path: '/payments/{payment_id}/risk-analyses',
                    status: 409,
                    method: 'post',
                    body: errorResponse,
                    headers: {}
                }).to.matchApiSchema();
            }
        });
    });
});
