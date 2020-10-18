const { expect } = require('chai');
const { formatDate } = require('../../../src/service/commonFunctions');
const { validateAppId, checkMaxActionsOnPayment } = require('../../../src/service/validations');
const { MAX_ACTIONS_FOR_PAYMENT } = require('../../../src/service/config');

describe('Validations tests', function () {
    describe('Positive flows: all allowed formats are converted to MM/YYYY', function () {
        const paymentMethod = {
            type: 'untokenized',
            expiration_date: ''
        };
        it('mm/yyyy is returned as it is', async function () {
            paymentMethod.expiration_date = '11/2020';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm/yyyy is returned as it is', async function () {
            paymentMethod.expiration_date = '11-2020';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm-yy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11-20';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm-yyyy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11-2020';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm.yyyy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11.2020';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm.yy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11.20';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm/yy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11/20';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm yyyy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11 2020';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm yy is converted to mm/yyyy', async function () {
            paymentMethod.expiration_date = '11 20';
            try {
                const result = formatDate(paymentMethod);
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
    });
    describe('Negative flows:', function () {
        it('m yy is converted to mm/yyyy', async function () {
            const paymentMethod = {
                type: 'untokenized',
                expiration_date: ''
            };
            paymentMethod.expiration_date = '1 20';
            try {
                formatDate(paymentMethod);
                throw new Error('Should not throw exception');
            } catch (error) {
                expect(error.statusCode).to.equal(400);
                expect(error.more_info).to.equal('expiration_date does not have a valid format');
            }
        });
        it('payment account-id is different from header account-id', function () {
            const headers = {
                'x-zooz-app-name': 'app-name-1',
                'x-zooz-account-id': 'account-id-1'
            };
            const paymentResource = {
                application_id: 'app-name-1',
                merchant_id: 'account-id-4'
            };
            try {
                validateAppId(paymentResource, headers);
                throw new Error('Should not throw exception');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
                expect(error.more_info).to.equal('App_id that is related to the payment was not found');
            }
        });
        it('should throw 404 error if payment app-id is undefined', function () {
            const headers = {
                'x-zooz-app-name': 'app-name-1',
                'x-zooz-account-id': 'account-id-1'
            };
            const paymentResource = {
                merchant_id: 'account-id-4'
            };
            try {
                validateAppId(paymentResource, headers);
                throw new Error('Should not throw exception');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
                expect(error.more_info).to.equal('App_id that is related to the payment was not found');
            }
        });
        it('should throw 404 error if payment merchant_id is undefined', function () {
            const headers = {
                'x-zooz-app-name': 'app-name-1',
                'x-zooz-account-id': 'account-id-1'
            };
            const paymentResource = {
                merchant_id: 'account-id-4'
            };
            try {
                validateAppId(paymentResource, headers);
                throw new Error('Should not throw exception');
            } catch (error) {
                expect(error.statusCode).to.equal(404);
                expect(error.more_info).to.equal('App_id that is related to the payment was not found');
            }
        });
    });
    describe('checkMaxActionsOnPayment', function () {
        it('Should return when number of actions in payment small than MAX_ACTIONS_FOR_PAYMENT', async function () {
            const paymentResource = {
                id: 'id',
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
                        }
                    ]
                }
            };

            const returnValue = checkMaxActionsOnPayment(paymentResource);
            expect(returnValue).to.be.undefined;
        });
        it('Should throw error when number of actions in payment exceeds than MAX_ACTIONS_FOR_PAYMENT', async function () {
            const paymentResource = {
                id: 'id',
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
                    ]
                }
            };
            try {
                checkMaxActionsOnPayment(paymentResource);
                throw new Error('should have gone to catch');
            } catch (error) {
                expect(error).to.deep.equal({
                    statusCode: 400,
                    details: [`Too many actions were made on this payment. Number of actions allowed:  ${MAX_ACTIONS_FOR_PAYMENT}`]
                });
            }
        });
    });
});
