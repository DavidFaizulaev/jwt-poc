const { expect } = require('chai');
const sinon = require('sinon');
const fss = require('fss-integration').fss;
const fssIntegration = require('../../../src/service/integrations/fss-integration');

let sandbox, fssIntegrationStub;

const paymentMethodDetails = {
    token: 'payment_method_token',
    type: 'tokenized'
};

describe('FSS integration module unit tests', function () {
    before(function () {
        sandbox = sinon.createSandbox();
    });
    afterEach(function () {
        sandbox.reset();
    });
    after(function () {
        sandbox.restore();
    });
    describe('handlePaymentMethodToken tests', function () {
        it('expired token state', async function () {
            fssIntegrationStub = sandbox.stub(fss, 'getPaymentMethod').resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'expired',
                        possible_next_events: []
                    }
                }
            });
            try {
                await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
                throw new Error('should have gone to catch');
            } catch (validationError) {
                expect(fssIntegrationStub.calledOnce).to.be.true;
                expect(validationError.statusCode).to.equal(400);
                expect(validationError.more_info).to.equal('Token does not exist.');
            }
        });
        it('used token state', async function () {
            fssIntegrationStub.resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'used',
                        possible_next_events: []
                    }
                }
            });
            try {
                await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
                throw new Error('should have gone to catch');
            } catch (validationError) {
                expect(fssIntegrationStub.calledOnce).to.be.true;
                expect(validationError.statusCode).to.equal(400);
                expect(validationError.more_info).to.equal('This token has already been used in a successful payment. Make sure the customer has given his consent to use his details again.');
            }
        });
        it('pending token state', async function () {
            fssIntegrationStub.resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'pending',
                        possible_next_events: []
                    }
                }
            });
            try {
                await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
                throw new Error('should have gone to catch');
            } catch (validationError) {
                expect(fssIntegrationStub.calledOnce).to.be.true;
                expect(validationError.statusCode).to.equal(400);
                expect(validationError.more_info).to.equal('Token under status pending cannot be used, please activate the token in order to use it');
            }
        });
        it('failed token state', async function () {
            fssIntegrationStub.resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'failed',
                        possible_next_events: []
                    }
                }
            });
            try {
                await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
                throw new Error('should have gone to catch');
            } catch (validationError) {
                expect(fssIntegrationStub.calledOnce).to.be.true;
                expect(validationError.statusCode).to.equal(400);
                expect(validationError.more_info).to.equal('Token cannot be used as token activation failed');
            }
        });
        it('canceled token state', async function () {
            fssIntegrationStub.resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'canceled',
                        possible_next_events: []
                    }
                }
            });
            try {
                await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
                throw new Error('should have gone to catch');
            } catch (validationError) {
                expect(fssIntegrationStub.calledOnce).to.be.true;
                expect(validationError.statusCode).to.equal(400);
                expect(validationError.more_info).to.equal('This token cannot be used as it was cancelled by the merchant');
            }
        });
        it('valid token state', async function () {
            fssIntegrationStub.resolves({
                statusCode: 200,
                body: {
                    payment_method_state: {
                        current_state: 'valid',
                        possible_next_events: []
                    }
                }
            });
            await fssIntegration.handlePaymentMethodToken('merchant_id', paymentMethodDetails, {});
            expect(fssIntegrationStub.calledOnce).to.be.true;
        });
    });
});
