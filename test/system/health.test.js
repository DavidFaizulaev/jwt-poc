const should = require('should');

const apiRequest = require('../utils/apiRequest');
const { APP_URL } = process.env;

describe('health', function() {
    it('should return healthy app', async function() {
        const { statusCode, body } = await apiRequest.get(`${APP_URL}/health`);
        should({ statusCode, body }).match({
            statusCode: 200,
            body: { status: 'UP' }
        });
    });
});