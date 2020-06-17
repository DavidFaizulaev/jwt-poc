const idempotencyHandler = require('idempotency-handler');
const gracefulShutdown = require('http-graceful-shutdown');
const logger = require('./logger');

const registerShutdownEvent = (server) => {
    gracefulShutdown(server, {
        signals: 'SIGINT SIGTERM',
        onShutdown: cleanup,
        development: false
    });
};

const cleanup = async () => {
    logger.info('Gracefully shutting down');
    try {
        await idempotencyHandler.closeConnection();
        logger.info('Successfully closed all connections to external services');
    } catch (error){
        logger.error(error, 'Failed to close connections to external services');
    }
};

module.exports = { registerShutdownEvent };
