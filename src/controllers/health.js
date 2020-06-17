const { BUILD, APP_NAME, CASSANDRA_KEYSPACE } = require('../service/config');
const idempotencyHandler = require('idempotency-handler');
const logger = require('../service/logger');

module.exports = {
    health: health
};

async function health(ctx){
    try {
        await idempotencyHandler.checkCassandraConnectivity(CASSANDRA_KEYSPACE);
        ctx.status = 200;
        ctx.body = { status: 'UP', build: BUILD };
    } catch (error) {
        logger.error({ error: error }, `${APP_NAME} is unhealthy`);
        ctx.status = 500;
        ctx.body = { status: 'DOWN', build: BUILD };
    }
}
