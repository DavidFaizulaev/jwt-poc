# Risk gateway service

* [Overview](#overview)
* [Running the service locally](#running-the-service-locally)
* [Running tests](#running-tests)
* [Running end-2-end tests locally](#running-end-2-end-tests-locally)

## Overview

Service integrates with risk providers and responsible for creating and retrieving risk resources.

## Running the service locally

To run the service locally, run the script: `./config/local/runServiceLocally.sh` and follow the instructions.
This script can:

1. Print the environment variables of the service in both vsCode and webstorm formats.
2. Cassandra migrations: run script `./config/cassandra/cassandra-scripts/do-migration.sh`
3. Starts the service `node ./app/server.js`

## Running End-2-End tests locally

In order to run system tests locally, we need to deploy a kong configuration that knows how to communicate with our local service.
The service & configuration will be deployed in QA.

### Run ngrok locally

1. Download and install ngrok: https://ngrok.com/
2. Run from the terminal:

``` shell
./ngrok http 3000
```

* 3000 - The port that we later configure the service to listen to.

3. Copy the ngrok http path. (e.g: http://30d08231.ngrok.io)

#### Configure Kong to your local instance

1. In the `config/local/runLocal.sh`, paste the ngrok path to the 'APP_URL_INTERNAL' variable
2. Choose a unique branch name for 'BRANCH_NAME' variable.
3. Run the `config/local/runLocal.sh` script.

The script will configure kong to your local instance & start the service locally as well.

__**NOTE**__: In case the delete configuration fails, the script will continue normally.

**DO NOT forget to delete the branch configuration in kong when you finish testing.**

##### Mandatory environment variables to run the service locally

APP_NAME
BUILD: "BUILD" **used by logger**
ENVIRONMENT
CLUSTER
CASSANDRA_REPLICATION_FACTOR
CASSANDRA_PASSWORD
CASSANDRA_USERNAME
CASSANDRA_ADDRESSES
CASSANDRA_KEYSPACE
CASSANDRA_LOCAL_DATA_CENTER: "datacenter1" **value for local deployment**
SERVICE_IAM_USERNAME
SERVICE_IAM_PASSWORD
PAYMENT_STORAGE_URL
FRAUD_SERVICE_URL
RISK_PROVIDER_SERVICE_NAME
FSS_URL
BASE_API_PAYMENTSOS_URL: https://api-qa.paymentsos.com **suggested default value**
RESULT_MAPPING_URL
COUNTRIES_SERVICE_URL
CURRENCIES_LOOKUP_URL
PROVIDER_CONFIGURATIONS_URL
APPS_STORAGE_URL
TARGET_TIMEOUT: "20000"
SECRETS_FILE_PATH: "" **value for local deployment, in order to not attempt getting secrets**
CACHE_REFRESH_INTERVAL_SECONDS: "43200" **suggested default value**
MAX_ACTIONS_TO_EXPAND_IN_PAYMENT: "100" **suggested default value**
MAX_ACTIONS_FOR_PAYMENT

#### Running end-2-end tests locally

EXTERNAL_ENVIRONMENT: test
PAYMENTS_OS_BASE_URL_FOR_TESTS: "https://api-qa.paymentsos.com/BRANCH_NAME" 'BRANCH_NAME' **the branch name you have selected and placed under `./config/local/runLocal.sh` script**
ORIGIN_URL: "https://control-qa.paymentsos.com"

* Make sure to change the TESTS_TARGET_URL with your branch name

#### Deleting branch configuration from Kong

1. Export environment variable `BRANCH_NAME` with the same value you gave when deploying the configuration.
2. Run script `./config/local/delete-qa-kong-configuration-only.sh`

## Running Integration tests

The tests a split per integration so you can run each suite separately.

```shell
npm run test:integration-apps-storage
npm run test:integration-fss
npm run test:integration-ps
npm run test:integration-provider
npm run test:integratio-pcs
```
