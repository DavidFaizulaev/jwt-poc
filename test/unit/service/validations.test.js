const { expect } = require('chai');
const { formatDate } = require('../../../src/service/commonFunctions');
const { validateAppId } = require('../../../src/service/validations');

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
                expect(error.statusCode).to.eql(404);
                expect(error.more_info).to.eql('App_id that is related to the payment was not found');
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
                expect(error.statusCode).to.eql(404);
                expect(error.more_info).to.eql('App_id that is related to the payment was not found');
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
                expect(error.statusCode).to.eql(404);
                expect(error.more_info).to.eql('App_id that is related to the payment was not found');
            }
        });
    });
});
