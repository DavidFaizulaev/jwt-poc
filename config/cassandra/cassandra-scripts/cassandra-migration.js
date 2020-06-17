'use strict';

const path = require('path');
const setupCassandra = require('cassandra-schema-setup');
const SECRETS_FILE_PATH = '/var/share/secrets/vault_secrets/secrets.json';
let cassandraAddress, cassandraUserName, cassandraPassword, cassandraKeyspce, cassandraReplicationFactor, createKeyspaceQuery, cassandraDataCenter;

createKeySpaceAndMigrationConfig();

async function createKeySpaceAndMigrationConfig() {
    cassandraAddress = process.env.CASSANDRA_ADDRESSES;
    cassandraKeyspce = process.env.CASSANDRA_KEYSPACE;
    cassandraReplicationFactor = process.env.CASSANDRA_REPLICATION_FACTOR || 3;
    cassandraDataCenter = process.env.CASSANDRA_LOCAL_DATA_CENTER || 'eu-central';
    createKeyspaceQuery = `CREATE KEYSPACE IF NOT EXISTS ${cassandraKeyspce} WITH replication = {'class': 'SimpleStrategy', 'replication_factor':${cassandraReplicationFactor}}`;
    console.log(`CREATE_NAME_SPACE_QUERY -----> ${createKeyspaceQuery}`);
    await initializeCassandraEnvironment();
}

function initSecrets() {
    const secrets = readSecretsEnv() || readSecretK8s();

    if (secrets) {
        cassandraPassword = secrets.CASSANDRA_PASSWORD;
        cassandraUserName = secrets.CASSANDRA_USERNAME;
    } else {
        throw new Error('Failed to load secrets');
    }
}

function readSecretsEnv() {
    console.log('init process.env secrets');
    if (process.env.CASSANDRA_USERNAME && process.env.CASSANDRA_PASSWORD) {
        return {
            CASSANDRA_PASSWORD: process.env.CASSANDRA_PASSWORD,
            CASSANDRA_USERNAME: process.env.CASSANDRA_USERNAME
        };
    } else {
        console.info('secrets not found in process.env');
    }
}

function readSecretK8s() {
    console.log('init k8s secrets');
    try {
        const secrets = require(SECRETS_FILE_PATH);
        return secrets;
    } catch (error) {
        console.info('k8s secrets file not found');
    }
}

function validateArguments() {
    const errorList = [];
    if (!cassandraKeyspce) {
        errorList.push('keyspace');
    }

    if (!cassandraAddress) {
        errorList.push('url');
    }

    if (!cassandraUserName) {
        errorList.push('username');
    }
    if (!cassandraPassword) {
        errorList.push('password');
    }

    if (errorList.length > 0) {
        throw new Error(`missing variables: ${errorList.toString()}`);
    }

    console.log(`CASSANDRA_KEYSPACE: ${cassandraKeyspce}`);
    console.log(`CASSANDRA_ADDRESSES: ${cassandraAddress}`);
    console.log(`CASSANDRA_USERNAME: ${cassandraUserName}`);
}

async function initializeCassandraEnvironment() {
    try {
        initSecrets();
        validateArguments();
        await setupCassandraData();
    } catch (error) {
        console.log('error occurred while trying to migrate', error);
        throw error;
    }
}

async function setupCassandraData() {
    const options = {
        cassandraClient:{
            contactPoints: cassandraAddress.split(','),
            keyspace: cassandraKeyspce,
            localDataCenter: cassandraDataCenter,
            replicationFactor: cassandraReplicationFactor,
        },
        username: cassandraUserName,
        password: cassandraPassword,
        keyspaceStrategy: `{'class' : 'NetworkTopologyStrategy', '${cassandraDataCenter}' : ${cassandraReplicationFactor}}`,
        upgradeScriptsPath: path.join(__dirname, '/migration-scripts'),
        rollbackScriptsPath: path.join(__dirname, '//migration-scripts-rollback'),
    };

    await setupCassandra.setup(options);
}
