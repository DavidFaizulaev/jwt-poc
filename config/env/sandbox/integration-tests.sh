echo Loading Integration-tests stage environment variables

# App
export SECRETS_FILE_PATH=''
export PORT=3000
export SHUTDOWN_TIMEOUT=10000
export APP_URL=http://127.0.0.1

# Cassandra
export CASSANDRA_ADDRESSES=$DOCKER_IP:9042
export CASSANDRA_REPLICATION_FACTOR=1
export CASSANDRA_USERNAME=cassandra
export CASSANDRA_PASSWORD=cassandra
export CLUSTER=dev

echo PORT: $PORT
echo SHUTDOWN_TIMEOUT: $SHUTDOWN_TIMEOUT
echo SERVICE_URL: $APP_URL
