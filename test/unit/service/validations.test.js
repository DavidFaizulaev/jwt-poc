const { expect } = require('chai');
const { formatDate } = require('../../../src/service/commonFunctions');

describe('Validations tests', function () {
    describe('Positive flows: all allowed formats are converted to MM/YYYY', function () {
        it('mm/yyyy is returned as it is', async function () {
            try {
                const result = formatDate('11/2020');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm-yy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11-20');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm-yyyy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11-2020');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm.yyyy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11.2020');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm.yy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11.20');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm/yy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11/20');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm yyyy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11 2020');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
        it('mm yy is converted to mm/yyyy', async function () {
            try {
                const result = formatDate('11 20');
                expect(result).to.equal('11/2020');
            } catch (error) {
                throw new Error('Should not throw exception');
            }
        });
    });
});
