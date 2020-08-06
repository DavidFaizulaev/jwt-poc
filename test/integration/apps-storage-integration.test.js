const supertest = require('supertest');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const serviceRequestSender = require('../helpers/service-request-sender');

const { FSS_URL, PAYMENT_STORAGE_URL, APPS_STORAGE_URL, RESULT_MAPPING_URL, COUNTRIES_SERVICE_URL, CURRENCIES_LOOKUP_URL } = require('../../src/service/config');

const app = require('../../src/app');

describe('Integration test - Apps storage', function() {
    let testApp, server;
    let merchantId, requestOptions, paymentId, serviceUrl;

    const requestBody = {
        payment_method: {
            type: 'untokenized',
            source_type: 'credit_card',
            holder_name: 'Dina Yakovlev',
            expiration_date: '12/20',
            last_4_digits: '1234',
            bin_number: '123456',
            card_number: '21321312321'
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
                'x-zooz-app-name': 'app_name',
                'content-type': 'application/json',
                'api-version': '1.3.0',
                accept: '*/*'
            }
        };

        nock(PAYMENT_STORAGE_URL)
            .get(`/payments/${paymentId}`)
            .reply(200, { payment_state: { current_state: 'payment_initial' }, application_id: 'app_name', merchant_id: merchantId });

        nock(FSS_URL)
            .post(`/merchants/${merchantId}/payment-methods`)
            .reply(200, createPaymentMethodTokenResponse);
    });

    describe('Errors from apps storage', function () {
        it('Should return status code 500 with error message when Apps storage returns 400', async () => {
            const appsNock = nock(APPS_STORAGE_URL)
                .get('/v1/applications/app_name')
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
                expect(appsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when Apps storage returns 500', async () => {
            const appsNock = nock(APPS_STORAGE_URL)
                .get('/v1/applications/app_name')
                .times(3)
                .reply(500, 'INTERNAL SERVER ERROR');

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['\"INTERNAL SERVER ERROR\"']);
                expect(appsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when Apps storage returns ETIMEDOUT', async () => {
            const appsNock = nock(APPS_STORAGE_URL)
                .get('/v1/applications/app_name')
                .times(3)
                .replyWithError({ code: 'ETIMEDOUT', message: 'ETIMEDOUT' });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ETIMEDOUT']);
                expect(appsNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when Apps storage returns ESOCKETTIMEDOUT', async () => {
            const appsNock = nock(APPS_STORAGE_URL)
                .get('/v1/applications/app_name')
                .times(3)
                .replyWithError({ code: 'ESOCKETTIMEDOUT', message: 'ESOCKETTIMEDOUT', headers: { Authorization: 'some_auth_string' } });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['ESOCKETTIMEDOUT']);
                expect(appsNock.isDone()).to.equal(true);
            }
        });
    });
});
