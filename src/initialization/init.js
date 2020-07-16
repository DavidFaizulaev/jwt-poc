const fssIntegration = require('../service/integrations/fss-integration');
const { logger } = require('../service/logger');
const swagger = require('express-ajv-swagger-validation');
const { SWAGGER_PATH } = require('../service/common');

async function init() {
    try {
        await fssIntegration.loginToFss();

        swagger.init(SWAGGER_PATH, {
            framework: 'koa',
            beautifyErrors: true,
            formats: []
        });
    } catch (error) {
        logger.error(error, 'Error in startup');
        throw error;
    }
}

module.exports = {
    init: init
};
