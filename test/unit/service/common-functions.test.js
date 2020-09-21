const { expect } = require('chai');
const { getPassThroughHeaders } = require('../../../src/service/commonFunctions');

describe('Common functions tests', function () {
    describe('getPassThroughHeaders', function () {
        it('Should only return valid pass through headers', async function () {
            const headers = {
                'x-zooz-request-id': '111111',
                idempotency_key: 'some_value',
                'zooz-mock': 'mock_value',
                'Zooz-Mock-PaymentsStorage': 'mock_value',
                'test-mock': 'mock_value',
                'test-mock-target': 'mock_value',
                'x-payments': '111111',
                'x-payments-os-env': '111111',
                'x-client-ip-address': '1.1.1.2',
                bad_headers: 'bad_value'
            };

            const resultHeaders = getPassThroughHeaders(headers);
            expect(resultHeaders).to.deep.equal({
                'x-zooz-request-id': '111111',
                idempotency_key: 'some_value',
                'zooz-mock': 'mock_value',
                'Zooz-Mock-PaymentsStorage': 'mock_value',
                'test-mock': 'mock_value',
                'test-mock-target': 'mock_value',
                'x-payments': '111111',
                'x-payments-os-env': '111111',
                'x-client-ip-address': '1.1.1.2'
            });
        });
    });
});
