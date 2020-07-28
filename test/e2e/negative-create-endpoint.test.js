const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const uuid = require('uuid');
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
});
