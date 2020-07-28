const entitiesMapper = require('entities-mapper-v130').Payment;
const fssIntegration = require('../service/integrations/fss-integration');
const { logger } = require('../service/logger');
const config = require('../service/config');
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

        await entitiesMapper.init({
            resultsMappingUrl: config.RESULT_MAPPING_URL,
            resultsMappingTimeoutMillis: config.TARGET_TIMEOUT,
            resultsMappingRefreshIntervalSeconds: config.CACHE_REFRESH_INTERVAL_SECONDS,
            countryLookupUrl: config.COUNTRIES_SERVICE_URL,
            countryLookupTimeoutMillis: config.TARGET_TIMEOUT,
            countryLookupRefreshIntervalSeconds: config.CACHE_REFRESH_INTERVAL_SECONDS,
            currenciesLookupUrl: config.CURRENCIES_LOOKUP_URL,
            currenciesLookupTimeoutMillis: config.TARGET_TIMEOUT,
            currenciesLookupRefreshIntervalSeconds: config.CACHE_REFRESH_INTERVAL_SECONDS,
            providerConfigurationsUrl: config.PROVIDER_CONFIGURATIONS_URL,
            providerConfigurationsTimeoutMillis: config.TARGET_TIMEOUT,
            maxActionsToExpandInPayment: config.MAX_ACTIONS_TO_EXPAND_IN_PAYMENT,
            baseApiPaymentsOsUrl: config.BASE_API_PAYMENTSOS_URL,
            logger,
            context: { x_zooz_request_id: 'init' }
        });
    } catch (error) {
        logger.error(error, 'Error in startup');
        throw error;
    }
}

module.exports = {
    init: init
};
