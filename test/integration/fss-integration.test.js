const supertest = require('supertest');
const { expect } = require('chai');
const nock = require('nock');
const uuid = require('uuid');
const serviceRequestSender = require('../helpers/service-request-sender');

const { FSS_URL, PAYMENT_STORAGE_URL } = require('../../src/service/config');

const app = require('../../src/app');

describe('Integration test - FSS', function() {
    let testApp, server;
    let merchantId, requestOptions, paymentId, serviceUrl;

    const requestBody = {
        transaction_type: 'charge',
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

    nock(FSS_URL)
        .post('/login')
        .reply(200, { permanent_token: 'permanent_token' });

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
                'x-zooz-account-id': merchantId
            }
        };

        nock(PAYMENT_STORAGE_URL)
            .get(`/payments/${paymentId}`)
            .reply(200, { payment_state: { current_state: 'payment_initial' } });
    });

    describe('Errors from fss', function () {
        it('Should return status code 500 with error message when FSS returns 400', async () => {
            const fssNock = nock(FSS_URL)
                .post(`/merchants/${merchantId}/payment-methods`)
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
                expect(fssNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message when FSS returns 500', async () => {
            const fssNock = nock(FSS_URL)
                .post(`/merchants/${merchantId}/payment-methods`)
                .times(3)
                .reply(500, 'INTERNAL SERVER ERROR');

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['\"INTERNAL SERVER ERROR\"']);
                expect(fssNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when FSS returns ETIMEDOUT', async () => {
            const fssNock = nock(FSS_URL)
                .post(`/merchants/${merchantId}/payment-methods`)
                .times(3)
                .replyWithError({ code: 'ETIMEDOUT', message: 'ETIMEDOUT' });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['Server Error']);
                expect(fssNock.isDone()).to.equal(true);
            }
        });
        it('Should return status code 500 with error message, when FSS returns ESOCKETTIMEDOUT', async () => {
            const fssNock = nock(FSS_URL)
                .post(`/merchants/${merchantId}/payment-methods`)
                .times(3)
                .replyWithError({ code: 'ESOCKETTIMEDOUT', message: 'ESOCKETTIMEDOUT', headers: { Authorization: 'some_auth_string' } });

            try {
                await serviceRequestSender.createRisk(requestOptions);
                throw new Error('should have thrown error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
                const responseBody = error.response.data;
                expect(responseBody.details).to.deep.equal(['Server Error']);
                expect(fssNock.isDone()).to.equal(true);
            }
        });
    });
});
