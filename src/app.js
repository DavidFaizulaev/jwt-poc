const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const apiMetrics = require('prometheus-api-metrics').koaMiddleware;
const { requestLogger } = require('./middlewares/request-logger');
const { handleError } = require('./middlewares/errorHandler');
const { init } = require('./initialization/init');
const infraRoutes = require('./routes/service-infra');
const config = require('./service/config');

module.exports = async () => {
    await init();

    const app = new Koa();

    // common middlewares
    app.use(bodyParser());
    app.use(apiMetrics({ durationBuckets: config.SOUTHBOUND_BUCKETS, excludeRoutes: ['/health', '/metrics'], includeQueryParams: false }));
    app.use(requestLogger);

    // error handler
    app.use(handleError);

    // routers
    app.use(infraRoutes.routes());
    return app;
};
