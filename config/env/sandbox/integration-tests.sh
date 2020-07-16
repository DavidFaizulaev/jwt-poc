echo Loading Integration-tests stage environment variables

# App
export SECRETS_FILE_PATH=''
export PORT=3000
export SHUTDOWN_TIMEOUT=10000
export APP_URL=http://127.0.0.1
export PAYMENT_STORAGE_URL='http://payments.com'

# Cassandra
export CASSANDRA_ADDRESSES=$DOCKER_IP:9042
export CASSANDRA_REPLICATION_FACTOR=1
export CASSANDRA_USERNAME=cassandra
export CASSANDRA_PASSWORD=cassandra
export CLUSTER=dev
export FSS_URL=http://fss-url.com
export SERVICE_IAM_USERNAME=user
export SERVICE_IAM_PASSWORD=password
export FRAUD_SERVICE_URL=http://{SERVICE_NAME}.com
export APPS_STORAGE_URL=http://apps-storage-url.com

echo PORT: $PORT
echo SHUTDOWN_TIMEOUT: $SHUTDOWN_TIMEOUT
echo SERVICE_URL: $APP_URL
