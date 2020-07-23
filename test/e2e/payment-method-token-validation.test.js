const { expect } = require('chai');
const { cloneDeep } = require('lodash');
const bunyan = require('bunyan');
const request = require('request-promise-native');
const uuid = require('uuid');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS, TOKEN_STATE_MACHINE_URL } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');
const commonSnips = require('../helpers/snips');

const { fullRiskRequestBody } = commonSnips;

const createLogger = () => {
    return bunyan.createLogger({
        name: 'payment method token validation tests',
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

const TESTING_TOKENS = {
    USED: '',
    EXPIRED: '',
    PENDING: '',
    FAILED: '',
    CANCELED: ''
};

const TESTING_TOKENS_ERROR_MESSAGES = {
    TOKEN_USED_ERROR: 'This token has already been used in a successful payment. Make sure the customer has given his consent to use his details again.',
    TOKEN_NOT_EXIST_ERROR: 'Token does not exist.',
    TOKEN_PENDING_ERROR: 'Token under status pending cannot be used, please activate the token in order to use it',
    TOKEN_FAILED_ERROR: 'Token cannot be used as token activation failed',
    TOKEN_CANCELED_ERROR: 'This token cannot be used as it was cancelled by the merchant'
};

describe('payment method token validation tests', function () {
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

        await preparePaymentMethodTokens();

        console.log(JSON.stringify(TESTING_TOKENS, null, 1));

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

    describe('Fail creating risk resource due to invalid token states', function () {
        it('Should fail to create risk resource when using used payment method token', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: TESTING_TOKENS.USED };
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                throw new Error('should gone to catch');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.response.body).to.eql({
                    category: 'api_request_error',
                    description: 'One or more request parameters are invalid.',
                    more_info: TESTING_TOKENS_ERROR_MESSAGES.TOKEN_USED_ERROR
                });
            }
        });
        it('Should fail to create risk resource when using expired payment method token', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: TESTING_TOKENS.EXPIRED };
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                throw new Error('should gone to catch');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.response.body).to.eql({
                    category: 'api_request_error',
                    description: 'One or more request parameters are invalid.',
                    more_info: TESTING_TOKENS_ERROR_MESSAGES.TOKEN_NOT_EXIST_ERROR
                });
            }
        });
        it('Should fail to create risk resource when using pending payment method token', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: TESTING_TOKENS.PENDING };
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                throw new Error('should gone to catch');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.response.body).to.eql({
                    category: 'api_request_error',
                    description: 'One or more request parameters are invalid.',
                    more_info: TESTING_TOKENS_ERROR_MESSAGES.TOKEN_PENDING_ERROR
                });
            }
        });
        it('Should fail to create risk resource when using failed payment method token', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: TESTING_TOKENS.FAILED };
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                throw new Error('should gone to catch');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.response.body).to.eql({
                    category: 'api_request_error',
                    description: 'One or more request parameters are invalid.',
                    more_info: TESTING_TOKENS_ERROR_MESSAGES.TOKEN_FAILED_ERROR
                });
            }
        });
        it('Should fail to create risk resource when using cancelled payment method token', async function () {
            const copiedRequestBody = cloneDeep(fullRiskRequestBody);
            copiedRequestBody.payment_method = { token: TESTING_TOKENS.CANCELED };
            try {
                await paymentsOSsdkClient.postRiskAnalyses({ request_body: copiedRequestBody, payment_id: paymentObject.id });
                throw new Error('should gone to catch');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.response.body).to.eql({
                    category: 'api_request_error',
                    description: 'One or more request parameters are invalid.',
                    more_info: TESTING_TOKENS_ERROR_MESSAGES.TOKEN_CANCELED_ERROR
                });
            }
        });
    });
});

async function preparePaymentMethodTokens() {
    await Promise.all((Object.keys(TESTING_TOKENS)).map(async (token) => {
        const createTokenResponse = await environmentPreparations.preparePaymentMethodToken(paymentsOSsdkClient);
        TESTING_TOKENS[token] = createTokenResponse.token;
    }));
    const activitiesArray = generateActivitiesArray();
    const requestStructure = generateTokenStateMachineRequest(activitiesArray);
    await request.post(requestStructure);
}

const generateActivitiesArray = () => {
    const today = new Date();
    const todaysTimestamp = today.getTime();
    today.setHours(today.getHours() - 1);
    const firstUsageTimestamp = today.getTime();
    today.setHours(today.getHours() - 2);
    const tokenCreationTimestamp = today.getTime();
    const activitiesArray = [
        // pending token
        {
            token: TESTING_TOKENS.PENDING,
            timestamp: tokenCreationTimestamp,
            activity: 'pending',
            'x-zooz-request-id': uuid.v4()
        },
        // failed token
        {
            token: TESTING_TOKENS.FAILED,
            timestamp: tokenCreationTimestamp,
            activity: 'pending',
            'x-zooz-request-id': uuid.v4()
        },
        {
            token: TESTING_TOKENS.FAILED,
            timestamp: firstUsageTimestamp,
            activity: 'failed',
            'x-zooz-request-id': uuid.v4()
        },
        // canceled token
        {
            token: TESTING_TOKENS.CANCELED,
            timestamp: tokenCreationTimestamp,
            activity: 'pending',
            'x-zooz-request-id': uuid.v4()
        },
        {
            token: TESTING_TOKENS.CANCELED,
            timestamp: firstUsageTimestamp,
            activity: 'active',
            'x-zooz-request-id': uuid.v4()
        },
        {
            token: TESTING_TOKENS.CANCELED,
            timestamp: todaysTimestamp,
            activity: 'canceled',
            'x-zooz-request-id': uuid.v4()
        },
        // expired token - created - expired
        {
            token: TESTING_TOKENS.EXPIRED,
            timestamp: tokenCreationTimestamp,
            activity: 'created',
            'x-zooz-request-id': uuid.v4()
        },
        {
            token: TESTING_TOKENS.EXPIRED,
            timestamp: firstUsageTimestamp,
            activity: 'expired',
            'x-zooz-request-id': uuid.v4()
        },
        // used token
        {
            token: TESTING_TOKENS.USED,
            timestamp: firstUsageTimestamp,
            activity: 'created',
            'x-zooz-request-id': uuid.v4()
        },
        {
            token: TESTING_TOKENS.USED,
            timestamp: todaysTimestamp,
            activity: 'used',
            'x-zooz-request-id': uuid.v4()
        }
    ];

    return activitiesArray;
};

const generateTokenStateMachineRequest = (activitiesArray) => {
    const requestHeaders = {
        'Content-Type': 'application/json',
        'x-zooz-request-id': uuid.v4()
    };

    const completeRequest = {
        uri: `${TOKEN_STATE_MACHINE_URL}/v1/tokens/activities`,
        headers: requestHeaders,
        resolveWithFullResponse: true,
        body: activitiesArray,
        json: true,
        timeout: 60000,
        method: 'POST'
    };

    return completeRequest;
};
