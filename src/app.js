const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const apiMetrics = require('prometheus-api-metrics').koaMiddleware;
const { BAD_REQUEST } = require('http-status-codes');
const { requestLogger } = require('./middlewares/request-logger');
const { handleError } = require('./middlewares/error-handler');
const { init } = require('./initialization/init');
const infraRoutes = require('./routes/service-infra');
const riskRoutes = require('./routes/risk-routes');
const config = require('./service/config');
const { NORTHBOUND_BUCKETS } = require('./service/common');
const { logger } = require('./service/logger');

module.exports = async () => {
    await init();

    const app = new Koa();

    // northbound request logger
    app.use(requestLogger);
    // error handler
    app.use(handleError);

    app.use(apiMetrics({ durationBuckets: NORTHBOUND_BUCKETS, excludeRoutes: ['/health', '/metrics'], includeQueryParams: false }));

    // common middlewares
    app.use(bodyParser({
        enableTypes: ['json'],
        onerror: function (err, ctx) {
            logger.error({ error: err, request: ctx.request }, 'body parse error');
            ctx.throw(BAD_REQUEST, 'body parse error', { more_info: 'Request body must be valid json' });
        },
        jsonLimit: config.MAX_REQUEST_SIZE
    }));

    // routers
    app.use(infraRoutes.routes());
    app.use(riskRoutes.routes());

    return app;
};
