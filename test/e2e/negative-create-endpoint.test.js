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

const { fullRiskRequestBody } = commonSnips;

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

    it.skip('Should return bad request response when to create risk analyses with non-existing payment method token', async function () {
        // unskip when token validation is added
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.payment_method = { token: uuid.v4() };
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
    it('Should return bad request response when to create risk analyses with invalid transaction_type', async function () {
        const copiedRequestBody = cloneDeep(fullRiskRequestBody);
        copiedRequestBody.transaction_type = 'transaction_type';
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
    it('Should return 400 with when request is sent without private key', async () => {
        try {
            const createRiskRequestComplete = {
                data: fullRiskRequestBody,
                url: `${PAYMENTS_OS_BASE_URL_FOR_TESTS}/payments/${paymentObject.id}/risk-analyses`,
                headers: {
                    'Content-Type': 'application/json',
                    'app-id': testsEnvs.application.id,
                    'api-version': API_VERSION,
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    accept: 'application/json'
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
                    'x-payments-os-env': EXTERNAL_ENVIRONMENT,
                    accept: 'application/json'
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
            expect(createRiskAnalysesResource.transaction_type).to.equal(fullRiskRequestBody.transaction_type);
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
            expect(createRiskAnalysesResource.transaction_type).to.equal(fullRiskRequestBody.transaction_type);
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
            }
        });
    });
});
