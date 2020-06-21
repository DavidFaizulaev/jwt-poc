cd config/cassandra/cassandra-scripts/
npm i
./do-migration.sh
cd ../../..

echo "############### ENVIRONMENT VARIABLES ###############"
echo "In what format would you like to print environment variables?"
echo "v - VsCode"
echo "w - Webstorm"
read FORMAT

if [ "$FORMAT" == "w" ]; then
  echo "############### PRINTING WEBSTORM VARIABLES ###############"
  echo "BUILD=$BUILD"
  echo "ENVIRONMENT=$ENVIRONMENT"
  echo "CLUSTER=$CLUSTER"
  echo "SERVICE_NAME=$SERVICE_NAME"
  echo "CASSANDRA_PASSWORD=$CASSANDRA_PASSWORD"
  echo "CASSANDRA_USERNAME=$CASSANDRA_USERNAME"
  echo "CASSANDRA_ADDRESSES=$CASSANDRA_ADDRESSES"
  echo "CASSANDRA_KEYSPACE=$CASSANDRA_KEYSPACE"
  echo "CASSANDRA_LOCAL_DATA_CENTER=$CASSANDRA_LOCAL_DATA_CENTER"
  echo "CASSANDRA_REPLICATION_FACTOR=$CASSANDRA_REPLICATION_FACTOR"
  echo "SERVICE_IAM_USERNAME=$SERVICE_IAM_USERNAME"
  echo "SERVICE_IAM_PASSWORD=$SERVICE_IAM_PASSWORD"
  echo "####### END VARIABLES SECTION #######"
elif [ "$FORMAT" == "v" ]; then
  echo "####### PRINTING VSCODE VARIABLES #######"
  echo "BUILD: \"$BUILD\","
  echo "ENVIRONMENT: \"$ENVIRONMENT\","
  echo "CLUSTER: \"$CLUSTER\","
  echo "SERVICE_NAME: \"$SERVICE_NAME\","
  echo "CASSANDRA_PASSWORD: \"$CASSANDRA_PASSWORD\","
  echo "CASSANDRA_USERNAME: \"$CASSANDRA_USERNAME\","
  echo "CASSANDRA_ADDRESSES: \"$CASSANDRA_ADDRESSES\","
  echo "CASSANDRA_KEYSPACE: \"$CASSANDRA_KEYSPACE\","
  echo "CASSANDRA_LOCAL_DATA_CENTER: \"$CASSANDRA_LOCAL_DATA_CENTER\","
  echo "CASSANDRA_REPLICATION_FACTOR: $CASSANDRA_REPLICATION_FACTOR,"
  echo "SERVICE_IAM_USERNAME: \"$SERVICE_IAM_USERNAME\","
  echo "SERVICE_IAM_PASSWORD: \"$SERVICE_IAM_PASSWORD\","
  echo "####### END VARIABLES SECTION #######"
fi

echo "Run service? (y/n)"
read RUN_SERVICE

if [ "$RUN_SERVICE" == "y" ]; then
  node ./src/server.js
fi



