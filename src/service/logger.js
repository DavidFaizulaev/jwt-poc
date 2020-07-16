
const { APP_NAME, CLUSTER, BUILD, LOG_LEVEL } = require('../service/config');
const loggerHelper = require('logger-helper');
const maskOptions = {
    creditCardMaskKeys: ['card_number'],
    fullMaskKeys: ['permanent_token', 'password', 'holder_name', 'card_holder_name', 'first_name', 'last_name', 'email', 'phone',
        'city', 'country', 'line1', 'line2', 'zip_code', 'title', 'state']
};

const requestLogger = loggerHelper.createLogger({
    maskOptions,
    name: APP_NAME,
    cluster: CLUSTER,
    build: BUILD,
    level: LOG_LEVEL,
    httpClientType: 'axios'
});

const logger = loggerHelper.createLogger({
    maskOptions,
    name: APP_NAME,
    cluster: CLUSTER,
    build: BUILD,
    level: LOG_LEVEL
});

module.exports = {
    logger,
    requestLogger
};
