const supertest = require('supertest');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const serviceRequestSender = require('../helpers/service-request-sender');

const { FSS_URL, PAYMENT_STORAGE_URL, RESULT_MAPPING_URL, COUNTRIES_SERVICE_URL, CURRENCIES_LOOKUP_URL, APPS_STORAGE_URL, FRAUD_SERVICE_URL, ENVIRONMENT, FEEDZAI_SERVICE_NAME } = require('../../src/service/config');

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

describe('Integration test - Risk provider', function() {
    let testApp, server;
    let merchantId, paymentId, appId, serviceUrl, requestOptions;
    let paymentStorageNock, appStorageNock;

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
            merchant_name: 'Merch',
            merchant_country_code: 'USA',
            merchant_email: 'Merch@gmail.com',
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
        appId = uuid.v4();
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
                accept: '*/*'
            }
        };

        paymentStorageNock = nock(PAYMENT_STORAGE_URL).get(`/payments/${paymentId}`).reply(200, { id: paymentId, payment_state: { current_state: 'payment_initial' }, application_id: appId, merchant_id: merchantId });

        appStorageNock = nock(APPS_STORAGE_URL)
            .get(`/v1/applications/${appId}`)
            .reply(200, { default_provider: 'default_provider_id' });
    });

    it('Should return status code 503 with error message when provider returns 503', async () => {
        const providerBaseUrl = FRAUD_SERVICE_URL.replace('{SERVICE_NAME}', `risk-${ENVIRONMENT}-${FEEDZAI_SERVICE_NAME}`);
        const providerNock = nock(providerBaseUrl)
            .post(`/payments/${paymentId}/risk-analyses`)
            .times(3)
            .reply(503, { more_info: 'Provider error - 504' });
        try {
            await serviceRequestSender.createRisk(requestOptions);
            throw new Error('should have thrown error');
        } catch (error) {
            expect(error.response.status).to.equal(503);
            const responseBody = error.response.data;
            expect(responseBody).to.deep.equal({
                category: 'provider_network_error',
                description: 'Unable to reach the provider network.',
                more_info: 'Service Unavailable'
            });
            expect(paymentStorageNock.isDone()).to.equal(true);
            expect(appStorageNock.isDone()).to.equal(true);
            expect(providerNock.isDone()).to.equal(true);
        }
    });
});
