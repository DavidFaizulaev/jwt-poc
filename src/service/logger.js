
const { APP_NAME, CLUSTER, BUILD, LOG_LEVEL } = require('../service/config');
const loggerHelper = require('logger-helper');
const logger = loggerHelper.createLogger({
    name: APP_NAME,
    cluster: CLUSTER,
    build: BUILD,
    level: LOG_LEVEL
});

module.exports = logger;
