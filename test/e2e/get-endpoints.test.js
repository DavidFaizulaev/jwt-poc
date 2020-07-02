const { expect } = require('chai');
const uuid = require('uuid');
const bunyan = require('bunyan');
const requestSender = require('../../src/service/request-sender');
const paymentsOSClient = require('paymentsos-client').paymentsOSClient;
const paymentsOSsdkClient = require('payments-os-sdk');
const { PAYMENTS_OS_BASE_URL, EXTERNAL_ENVIRONMENT, ORIGIN_URL, API_VERSION, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS } = require('../helpers/test-config');
const environmentPreparations = require('../helpers/environment-preparations');
const testsCommonFunctions = require('../helpers/tests-common-functions');
const { HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION, HDR_X_ZOOZ_REQUEST_ID, HDR_X_ZOOZ_PAYMENT_SERVICE_REQUEST_ID } = require('../../src/service/common');

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

describe('Testing get risk analyses resource requests', function () {
    this.timeout(1500000);
    let testsEnvs, paymentObject, postResponse, options;
    before(async function(){
        paymentsOSClient.init({
            BASE_URL: PAYMENTS_OS_BASE_URL,
            env: EXTERNAL_ENVIRONMENT,
            origin: ORIGIN_URL
        });
        paymentsOSsdkClient.init(sdkConfigurationPreparations, false);

        testsEnvs = await environmentPreparations.prepareTestEnvironment(paymentsOSClient, paymentsOSsdkClient, RISK_PROVIDER_CONFIGURATION);

        await testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL);

        Object.assign(sdkConfigurationPreparations, {
            APP_ID: testsEnvs.application.id,
            PUBLIC_KEY: testsEnvs.app_keys[1].key,
            PRIVATE_KEY: testsEnvs.app_keys[0].key
        });

        await paymentsOSsdkClient.init(sdkConfigurationPreparations, false);

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

    describe('Full flow -> First create several risk analyses resources then create get requests', function () {
        describe('NEGATIVE: Failed attempts to get risk analyses resource', function () {
            before(async function(){
                await testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS);
            });
            it('Get all risk analyses with payment id that exists but no risk analyses resources exist', async function f() {
                try {
                    const response = await paymentsOSsdkClient.getAllRiskAnalyses({
                        payment_id: paymentObject.id
                    });
                    expect(response.statusCode).to.eql(200);
                    expect(response.body).to.be.length(0);
                } catch (error) {
                    throw new Error('Error should not have been thrown');
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
        describe('POSITIVE: Successfully retrieve created risk analyses resource', function () {
            beforeEach(async function () {
                await testsCommonFunctions.changeTestUrl(paymentsOSsdkClient, sdkConfigurationPreparations, RISK_PROVIDER_CONFIGURATION, PAYMENTS_OS_BASE_URL_FOR_TESTS);
                const url = `http://internal.eks-qa.zooz.co/sandbox-payment-storage/payments/${paymentObject.id}/risk_analyses`;
                options = {
                    url: url,
                    method: 'post',
                    headers: {
                        [HDR_X_ZOOZ_REQUEST_ID]: uuid.v4(),
                        [HDR_X_ZOOZ_PAYMENT_SERVICE_API_VERSION]: '1.0',
                        [HDR_X_ZOOZ_PAYMENT_SERVICE_REQUEST_ID]: uuid.v4()
                    },
                    data: {
                        action_time: '2020-06-17T10:25:38.387Z',
                        result_data: {
                            status: 'Pending',
                            zooz_operation_error: {
                                error_category: 'string',
                                error_sub_category: 'string'
                            }
                        },
                        transaction_type: 'charge',
                        payment_method: {}
                    }
                };
                try {
                    postResponse = await requestSender.sendRequest(options);
                } catch (error) {
                    console.log(error.response.body);
                }
            });
            it('Get the specific risk analyses resource by id', async function () {
                try {
                    const response = await paymentsOSsdkClient.getRiskAnalysesByRiskAnalysesId({
                        payment_id: paymentObject.id, risk_analyses_id: postResponse.data.id
                    });
                    expect(response.statusCode).to.eql(200);
                    expect(response.body.result_data).to.eql(options.data.result_data);
                    expect(response.body.id).to.eql(postResponse.data.id);
                } catch (error) {
                    throw new Error('Error should not have been thrown');
                }
            });
            it('Get all risk analyses and check an array if returned', async function () {
                try {
                    const response = await paymentsOSsdkClient.getAllRiskAnalyses({
                        payment_id: paymentObject.id
                    });
                    expect(response.statusCode).to.eql(200);
                    expect(response.body).to.be.length(2);
                } catch (error) {
                    throw new Error('Error should not have been thrown');
                }
            });
        });
    });
});