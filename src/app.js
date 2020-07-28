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
const { logger } = require('./service/logger');

module.exports = async () => {
    await init();

    const app = new Koa();

    // error handler
    app.use(handleError);

    // common middlewares
    app.use(bodyParser({
        enableTypes: ['json'],
        onerror: function (err, ctx) {
            logger.error({ error: err, request: ctx.request }, 'body parse error');
            ctx.throw(BAD_REQUEST, 'body parse error', { more_info: 'Request body must be valid json' });
        },
        jsonLimit: config.MAX_REQUEST_SIZE
    }));

    app.use(apiMetrics({ durationBuckets: config.SOUTHBOUND_BUCKETS, excludeRoutes: ['/health', '/metrics'], includeQueryParams: false }));
    app.use(requestLogger);

    // routers
    app.use(infraRoutes.routes());
    app.use(riskRoutes.routes());

    return app;
};
