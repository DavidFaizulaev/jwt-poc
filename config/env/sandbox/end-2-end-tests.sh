# External Services:
export SECRETS_FILE_PATH=''
export PAYMENTS_OS_BASE_URL=https://api-qa.paymentsos.com
export EXTERNAL_ENVIRONMENT=test
export ORIGIN_URL=https://control-qa.paymentsos.com/
export PAYMENTS_OS_BASE_URL_FOR_TESTS=https://api-qa.paymentsos.com/$BRANCH_NAME

# Cassandra
export CASSANDRA_ADDRESSES=$DOCKER_IP:9042
export CASSANDRA_REPLICATION_FACTOR=1
export CASSANDRA_USERNAME=cassandra
export CASSANDRA_PASSWORD=cassandra
export CLUSTER=dev

echo "PAYMENTS_OS_BASE_URL: $PAYMENTS_OS_BASE_URL"
echo "PAYMENTS_OS_BASE_URL_FOR_TESTS: $PAYMENTS_OS_BASE_URL_FOR_TESTS"
echo "ORIGIN_URL: $ORIGIN_URL"
