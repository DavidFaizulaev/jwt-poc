const supertest = require('supertest');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const serviceRequestSender = require('../helpers/service-request-sender');

const { FSS_URL, PAYMENT_STORAGE_URL, RESULT_MAPPING_URL, COUNTRIES_SERVICE_URL, CURRENCIES_LOOKUP_URL, MAX_ACTIONS_FOR_PAYMENT } = require('../../src/service/config');

const app = require('../../src/app');

describe('Integration test - Payment storage', function() {
    let testApp, server;
    let merchantId, requestOptions, paymentId, serviceUrl;

    const requestBody = {
        payment_method: {
            type: 'untokenized',
            source_type: 'credit_card',
            holder_name: 'Dina Yakovlev',
            expiration_date: '12/20',
            last_4_digits: '1234',
            bin_number: '123456'
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
            mcc: '1234',
            merchant_name: 'merchant name',
            merchant_country_code: 'USA',
            merchant_email: 'some_email@gmail.com',
            merchant_zip_code: '12345',
            merchant_city: 'New York'
        },
        acquirer: {
            id: 'id',
            country: 'USA'
        },
        provider_specific_data: {
            data: 'val'
        }
    };

    nock(FSS_URL)
        .post('/login')
        .reply(200, { permanent_token: 'permanent_token' });

    nock(RESULT_MAPPING_URL).get('/categories').reply(200, {});
    nock(COUNTRIES_SERVICE_URL).get('/countries').reply(200, {});
    nock(CURRENCIES_LOOKUP_URL).get('/currencies').reply(200, [
        {
            decimal_digits: 2,
            code: 'PLN'
        }]);

    before(async function () {
        testApp = (await app()).callback();
        server = supertest(testApp).get('/');
        serviceUrl = `http://127.0.0.1:${server.app.address().port}`;
    });

    after(function(done){
        server.end(done);
    });

    afterEach(function(){
        nock.cleanAll();
    });

    beforeEach(function () {
        merchantId = uuid.v4();
        paymentId = uuid.v4();
        requestOptions = {
            paymentId: paymentId,
            serviceUrl,
            body: requestBody,
            headers: {
                'x-zooz-request-id': uuid.v4(),
                'x-zooz-account-id': merchantId,
                'content-type': 'application/json',
                'api-version': '1.3.0',
                host: 'tests',
                'user-agent': 'test-agent',
                accept: '*/*'
            }
        };
    });

    describe('Errors from payment storage', function () {
        it('Should return status code 400 with error message when PS returns 400 without error code', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(400, {
                    message: 'Input validation error',
                    validation_errors: [
                        'headers should have required property "x-zooz-request-id"'
                    ]
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['{\"message\":\"Input validation error\",\"validation_errors\":[\"headers should have required property \\\"x-zooz-request-id\\\"\"]}']);

                const paymentStorageRequestHeaders = psNock.interceptors[0].req.headers;
                expect(paymentStorageRequestHeaders).to.have.all.keys('x-zooz-account-id', 'x-zooz-payment-service-api-version', 'x-zooz-request-id', 'accept', 'host', 'user-agent');
                expect(paymentStorageRequestHeaders.host).to.not.equal('tests');
                expect(paymentStorageRequestHeaders['user-agent']).to.not.equal('test-agent');
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 400 with error message when PS returns 400 with error_code "InvalidPaymentId"', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(400, {
                    error_code: 'InvalidPaymentId',
                    details: [
                        'df2d5881-1651-4757-805b-db992850149} should be UUID'
                    ]
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['df2d5881-1651-4757-805b-db992850149} should be UUID']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 400 with error message when PS returns 404 with error_code "PaymentNotFound"', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(404, {
                    error_code: 'PaymentNotFound',
                    details: [
                        'payment not found, paymentId:df2d5881-1651-4757-805b-db9928501494'
                    ]
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(404);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['payment not found, paymentId:df2d5881-1651-4757-805b-db9928501494']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 400 with error message when PS returns 404 with error_code "ActionNotFound"', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(404, {
                    error_code: 'ActionNotFound',
                    details: [
                        'action not found, paymentId:7d30c82f-674b-4224-beda-0aa5cf006e5a ,actionId: 7d30c82f-674b-4224-beda-0aa5cf006e5a'
                    ]
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(404);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['action not found, paymentId:7d30c82f-674b-4224-beda-0aa5cf006e5a ,actionId: 7d30c82f-674b-4224-beda-0aa5cf006e5a']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when PS returns 404 without error code', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(404, {
                    timestamp: '2020-09-11T08:19:20.099Z',
                    status: 404,
                    error: 'Not Found',
                    message: 'No message available',
                    path: '/paymentse/df2d5881-1651-4757-805b-db9928501494'
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['Server Error']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when PS returns 500', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .times(3)
                .reply(500, 'INTERNAL SERVER ERROR');
            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['"INTERNAL SERVER ERROR"']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when PS returns ETIMEDOUT', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .times(3)
                .replyWithError({ code: 'ETIMEDOUT', message: 'ETIMEDOUT' });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ETIMEDOUT']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when PS returns ESOCKETTIMEDOUT', async () => {
            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .times(3)
                .replyWithError({ code: 'ESOCKETTIMEDOUT', message: 'ESOCKETTIMEDOUT', headers: { Authorization: 'some_auth_string' } });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ESOCKETTIMEDOUT']);
                expect(psNock.isDone()).to.equal(true);
            }
        });
    });
    describe('Validation errors', function () {
        it('Should return status code 400 with error message when number of actions in payment exceeds MAX_ACTIONS_FOR_PAYMENT', async () => {
            const paymentResourceWithExceededNumActions = {
                id: 'id',
                payment_state: {
                    current_state: 'payment_initial'
                },
                actions_by_type: {
                    initial_state: {
                        data: {
                            id: '7ada11d5-3124-4283-87ee-396515ca5eec'
                        },
                        href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec'
                    },
                    risk_analyses: [
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        }
                    ],
                    authentications: [
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        }
                    ],
                    authorizations: [
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        },
                        {
                            data: {
                                id: '2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                            },
                            href: 'payments/7ada11d5-3124-4283-87ee-396515ca5eec/risk-analyses/2eece7b1-7e0c-4cdf-afdb-f6b0a8e0e4d8'
                        }
                    ]
                },
                merchant_id: merchantId
            };

            const psNock = nock(PAYMENT_STORAGE_URL)
                .get(`/payments/${paymentId}`)
                .reply(200, paymentResourceWithExceededNumActions);

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                const responseBody = error.response.data;
                expect(responseBody).to.deep.equal({
                    details: [`Too many actions were made on this payment. Number of actions allowed:  ${MAX_ACTIONS_FOR_PAYMENT}`]
                });
                expect(psNock.isDone()).to.equal(true);
            }
        });
    });
});
