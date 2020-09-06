const { expect } = require('chai');
const testConfig = require('../helpers/test-config');
const serviceRequestSender = require('../helpers/service-request-sender');

describe('Health system test', function () {
    it('Should return service is UP response', async function () {
        const healthCheckResponse = await serviceRequestSender.healthCheck(testConfig.SERVICE_URL);
        expect(healthCheckResponse.status).to.equal(200);
        expect(healthCheckResponse.data).to.have.all.keys('status', 'build');
        expect(healthCheckResponse.data.status).to.equal('UP');
        expect(healthCheckResponse.data.build).to.not.be.undefined;
        expect(healthCheckResponse.data.build).to.not.be.null;
    });
});