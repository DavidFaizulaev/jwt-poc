const should = require('should');

const { APP_URL } = process.env;
const apiRequest = require('../utils/apiRequest');

describe('System test', function() {
    it('should return 404 when endpoint not exists', async function() {
        await apiRequest.get(`${APP_URL}/not-found`)
            .should.be.rejected()
            .then(err => {
                const { statusCode, error } = err;
                should({ statusCode, error }).match({
                    statusCode: 404,
                    error: { details: ['Not Found'] }
                });
            });
    });
});
