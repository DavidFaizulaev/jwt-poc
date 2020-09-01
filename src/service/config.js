const { createEnvObject, mandatory } = require('envboss');

let cassandraUserName, cassandraPassword;
let fssUsername, fssPassword;

if (process.env.SECRETS_FILE_PATH) { // check if secrets json file is exists
    const secretsObject = require(process.env.SECRETS_FILE_PATH);
    cassandraUserName = secretsObject.CASSANDRA_USERNAME;
    cassandraPassword = secretsObject.CASSANDRA_PASSWORD;
    fssUsername = secretsObject.SERVICE_IAM_USERNAME;
    fssPassword = secretsObject.SERVICE_IAM_PASSWORD;
} else { // search if user & password exits in env variables
    cassandraUserName = process.env.CASSANDRA_USERNAME;
    cassandraPassword = process.env.CASSANDRA_PASSWORD;
    fssUsername = process.env.SERVICE_IAM_USERNAME;
    fssPassword = process.env.SERVICE_IAM_PASSWORD;
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
    MAX_REQUEST_SIZE: { default: '1mb' },
    SOUTHBOUND_BUCKETS: [0.05, 0.1, 0.2, 0.5, 1, 2, 4, 8, 16, 32, 64],
    NORTHBOUND_BUCKETS: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 8, 16, 32, 64],
    DEFAULT_REQUEST_RETRIES: { default: 2 },
    RISK_PROVIDER_SERVICE_NAME: { mandatory },

    // Cassandra
    CASSANDRA_KEYSPACE: { mandatory },
    CASSANDRA_ADDRESSES: { mandatory },
    CASSANDRA_REPLICATION_FACTOR: { mandatory },

    // Fss
    FSS_REFRESH_TOKEN_INTERVAL: { default: 7200 },
    FSS_URL: { mandatory },

    // Services urls
    PAYMENT_STORAGE_URL: { mandatory },

    // FRAUD
    FRAUD_SERVICE_URL: { mandatory },

    // Apps
    APPS_STORAGE_URL: { mandatory },

    // entities mapper
    RESULT_MAPPING_URL: { mandatory },
    COUNTRIES_SERVICE_URL: { mandatory },
    CURRENCIES_LOOKUP_URL: { mandatory },
    BASE_API_PAYMENTSOS_URL: { mandatory },
    PROVIDER_CONFIGURATIONS_URL: { mandatory },
    TARGET_TIMEOUT: { mandatory },
    CACHE_REFRESH_INTERVAL_SECONDS: { mandatory },
    MAX_ACTIONS_TO_EXPAND_IN_PAYMENT: { mandatory }
});

environmentVariables.CASSANDRA_USERNAME = cassandraUserName;
environmentVariables.CASSANDRA_PASSWORD = cassandraPassword;
environmentVariables.CASSANDRA_ADDRESSES = environmentVariables.CASSANDRA_ADDRESSES.split(',');

environmentVariables.FSS_USERNAME = fssUsername;
environmentVariables.FSS_PASSWORD = fssPassword;

module.exports = environmentVariables;
