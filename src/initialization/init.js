const idempotencyHandler = require('idempotency-handler');
const { CASSANDRA_ADDRESSES, CASSANDRA_USERNAME, CASSANDRA_PASSWORD, CASSANDRA_KEYSPACE, CASSANDRA_REPLICATION_FACTOR } = require('../service/config');
const logger = require('../service/logger');

const idempotencyOptions = {
    logger: logger,
    addresses: CASSANDRA_ADDRESSES,
    username: CASSANDRA_USERNAME,
    password: CASSANDRA_PASSWORD,
    keyspace: CASSANDRA_KEYSPACE,
    replication_factor: CASSANDRA_REPLICATION_FACTOR
};

async function init() {
    await idempotencyHandler.init(idempotencyOptions);
}

module.exports = {
    init: init
};
