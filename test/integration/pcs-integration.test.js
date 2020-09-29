const supertest = require('supertest');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const serviceRequestSender = require('../helpers/service-request-sender');

const { FSS_URL, PAYMENT_STORAGE_URL, RESULT_MAPPING_URL, COUNTRIES_SERVICE_URL, CURRENCIES_LOOKUP_URL, PROVIDER_CONFIGURATIONS_URL, APPS_STORAGE_URL } = require('../../src/service/config');

const app = require('../../src/app');

const createPaymentMethodTokenResponse = {
    created_timestamp: 1595502986106,
    payment_method_token: 'e7a3c9bf-7907-4f13-8652-c2507c48492a',
    billing_address: {
        first_name: 'John',
        last_name: 'Doe',
        address_line_1: 'My first address',
        address_line_2: 'My second address line',
        address_line_3: 'My third address line',
        city: 'My City',
        state: 'IL',
        country: 'ILS',
        zip_code: '02025',
        phone_number: '972551234567'
    },
    last_used: '2020-07-23T11:16:26.106Z',
    payment_method_details: {
        payment_method_type: 'CreditCard',
        card_holder_name: 'Mr Nobody',
        expiration_date: '12/2025',
        last_4_digits: '0007',
        is_luhn_valid: true,
        bin_details: {
            bin: '522345',
            card_vendor_name: 'MASTERCARD',
            card_issuer_name: 'BANCARD, S.A.',
            card_type_name: 'CREDIT',
            card_level_name: 'STANDARD',
            card_country_code: 'PRY'
        }
    },
    payment_method_state: {
        current_state: 'valid',
        possible_next_events: []
    }
};

describe('Integration test - PCS', function() {
    let testApp, server;
    let merchantId, requestOptions, paymentId, serviceUrl;

    const requestBody = {
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
        const appId = uuid.v4();
        merchantId = uuid.v4();
        paymentId = uuid.v4();
        requestOptions = {
            paymentId: paymentId,
            serviceUrl,
            body: requestBody,
            headers: {
                'x-zooz-request-id': uuid.v4(),
                'x-zooz-account-id': merchantId,
                'x-zooz-app-name': appId,
                'content-type': 'application/json',
                'api-version': '1.3.0',
                host: 'tests',
                'user-agent': 'test-agent',
                accept: '*/*'
            }
        };

        nock(PAYMENT_STORAGE_URL)
            .get(`/payments/${paymentId}`)
            .reply(200, { payment_state: { current_state: 'payment_initial' }, application_id: appId, merchant_id: merchantId });

        nock(APPS_STORAGE_URL)
            .get(`/v1/applications/${appId}`)
            .reply(200, { default_provider: 'default_provider_id' });

        nock(FSS_URL)
            .post(`/merchants/${merchantId}/payment-methods`)
            .reply(200, createPaymentMethodTokenResponse);
    });

    describe('Errors from pcs', function () {
        it('Should return status code 500 with error message when PCS returns 400', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .reply(400, {
                    error_code: '40002',
                    description: 'Bad Request Error',
                    message: '[{\"message\":\"\\\"x-zooz-request-id\\\" is required (in headers).\",\"path\":\"x-zooz-request-id\"}]'
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['{"error_code":"40002","description":"Bad Request Error","message":"[{\\"message\\":\\"\\\\\\"x-zooz-request-id\\\\\\" is required (in headers).\\",\\"path\\":\\"x-zooz-request-id\\"}]"}']);

                const appsStorageRequestHeaders = pcsNock.interceptors[0].req.headers;
                expect(appsStorageRequestHeaders).to.have.all.keys('x-zooz-account-id', 'x-zooz-request-id', 'x-zooz-app-name', 'x-zooz-access-environment', 'accept', 'host', 'user-agent');
                expect(appsStorageRequestHeaders.host).to.not.equal('tests');
                expect(appsStorageRequestHeaders['user-agent']).to.not.equal('test-agent');
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 400 with error message when PCS returns 404 for invalid fund_target_id', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .reply(404, {
                    code: '40401',
                    description: 'Resource was not found',
                    message: 'No Configuration was found with the provided Id.'
                });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                const responseBody = error.response.data;
                expect(responseBody.message).to.deep.equal('No Configuration was found with the provided Id.');
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when PCS returns ETIMEDOUT', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .times(3)
                .replyWithError({ code: 'ETIMEDOUT', message: 'ETIMEDOUT' });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ETIMEDOUT']);
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when PCS returns ESOCKETTIMEDOUT', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .times(3)
                .replyWithError({ code: 'ESOCKETTIMEDOUT', message: 'ESOCKETTIMEDOUT', headers: { Authorization: 'some_auth_string' } });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ESOCKETTIMEDOUT']);
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when PCS returns 500', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .times(3)
                .reply(500, 'INTERNAL SERVER ERROR');
            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['\"INTERNAL SERVER ERROR\"']);
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when PCS returns 503', async () => {
            const pcsNock = nock(PROVIDER_CONFIGURATIONS_URL)
                .get('/v1/configurations/default_provider_id?ext_info=true&filterConfData=true')
                .times(3)
                .reply(503, 'SERVICE_UNAVAILABLE');
            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['Server Error']);
                expect(pcsNock.isDone()).to.equal(true);
            }
        });
    });
});
