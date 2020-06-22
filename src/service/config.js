const { createEnvObject, mandatory } = require('envboss');

let cassandraUserName, cassandraPassword;

if (process.env.SECRETS_FILE_PATH) { // check if secrets json file is exists
    const secretsObject = require(process.env.SECRETS_FILE_PATH);
    cassandraUserName = secretsObject.CASSANDRA_USERNAME;
    cassandraPassword = secretsObject.CASSANDRA_PASSWORD;
} else { // search if user & password exits in env variables
    cassandraUserName = process.env.CASSANDRA_USERNAME;
    cassandraPassword = process.env.CASSANDRA_PASSWORD;
}

const environmentVariables = createEnvObject({
    BUILD: { mandatory },
    ENVIRONMENT: { mandatory },
    CLUSTER: { mandatory },
    APP_NAME: { mandatory },

    // optional
    NEW_CONNECTIONS_TIMEOUT: { default: 7500 },
    LOG_LEVEL: { default: 'info' },
    PORT: { default: 3000 },
    KEEP_ALIVE_TIMEOUT: { default: 120000 },
    SHUTDOWN_TIMEOUT: { default: 10000 },
    SOUTHBOUND_BUCKETS: [0.05, 0.1, 0.2, 0.5, 1, 2, 4, 8, 16, 32, 64],
    NORTHBOUND_BUCKETS: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 8, 16, 32, 64],
    DEFAULT_REQUEST_RETRIES: { default: 3 },

    // Cassandra
    CASSANDRA_KEYSPACE: { mandatory },
    CASSANDRA_ADDRESSES: { mandatory },
    CASSANDRA_REPLICATION_FACTOR: { mandatory }
});

environmentVariables.CASSANDRA_USERNAME = cassandraUserName;
environmentVariables.CASSANDRA_PASSWORD = cassandraPassword;
environmentVariables.CASSANDRA_ADDRESSES = environmentVariables.CASSANDRA_ADDRESSES.split(',');

module.exports = environmentVariables;
