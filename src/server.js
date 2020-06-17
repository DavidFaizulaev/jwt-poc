const _app = require('./app');
const gracefulShutdown = require('./service/shutdown');
const logger = require('./service/logger');
const { PORT } = require('./service/config');

_app().then(app => {
    app.listen(PORT, function () { logger.info(`App listening on port ${PORT}...`) });

    gracefulShutdown.registerShutdownEvent(app);

    process.on('uncaughtException', function (reason) {
        logger.error('Possibly Uncaught Exception at: ', reason);
    });

    process.on('unhandledRejection', function (reason, p) {
        logger.error('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    });
}).catch(e => {
    logger.error(e, 'Application failed to initialize');
    throw e;
});
