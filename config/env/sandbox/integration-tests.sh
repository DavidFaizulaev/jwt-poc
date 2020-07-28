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

export BASE_API_PAYMENTSOS_URL=BASE_API_PAYMENTSOS_URL
export RESULT_MAPPING_URL=http://fake-url.v2.results-mapping.$QA_DCOS_URL
export COUNTRIES_SERVICE_URL=http://fake.country-lookup.$QA_DCOS_URL
export CURRENCIES_LOOKUP_URL=http://fake.currencies-lookup.$QA_DCOS_URL
export PROVIDER_CONFIGURATIONS_URL=http://fake.provider-configurations.$QA_DCOS_URL
export TARGET_TIMEOUT=5000
export CACHE_REFRESH_INTERVAL_SECONDS=43200
export MAX_ACTIONS_TO_EXPAND_IN_PAYMENT=100

echo PORT: $PORT
echo SHUTDOWN_TIMEOUT: $SHUTDOWN_TIMEOUT
echo SERVICE_URL: $APP_URL
