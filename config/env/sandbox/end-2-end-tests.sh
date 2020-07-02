# External Services:
export SECRETS_FILE_PATH=''
export PAYMENT_STORAGE_URL=http://internal.eks-qa-apps.zooz.co/sandbox-payment-storage
export PAYMENTS_OS_BASE_URL=https://api-qa.paymentsos.com,
export EXTERNAL_ENVIRONMENT=test
export ORIGIN_URL=https://control-qa.paymentsos.com/

# Cassandra
export CASSANDRA_ADDRESSES=$DOCKER_IP:9042
export CASSANDRA_REPLICATION_FACTOR=1
export CASSANDRA_USERNAME=cassandra
export CASSANDRA_PASSWORD=cassandra
export CLUSTER=dev

echo "PAYMENT_STORAGE_URL: $PAYMENT_STORAGE_URL"