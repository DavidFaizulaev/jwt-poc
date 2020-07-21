const { expect } = require('chai');
const uuid = require('uuid');
const bunyan = require('bunyan');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');

const createLogger = () => {
    return bunyan.createLogger({
        name: 'Negative get endpoints tests',
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

describe('Get risk analyses negative flows', function () {
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

    it('Get all risk analyses on payment resource with no risk analyses on it', async function () {
        const response = await paymentsOSsdkClient.getAllRiskAnalyses({
            payment_id: paymentObject.id
        });
        expect(response.statusCode).to.eql(200);
        expect(response.body).to.be.length(0);
    });
    it('Get all risk analyses on non-existing payment id', async function () {
        try {
            await paymentsOSsdkClient.getAllRiskAnalyses({ payment_id: uuid.v4() });
            throw new Error('Error should have been thrown');
        } catch (error) {
            expect(error.statusCode).to.equal(404);
            expect(error.response.body).to.eql({
                category: 'api_request_error',
                description: 'The resource was not found.'
            });
        }
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
});
