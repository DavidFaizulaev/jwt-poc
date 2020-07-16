#!/bin/sh
set -e

# Check mandatory envs for this scripts
if [ -z $APP_URL_INTERNAL ]; then echo "missing APP_URL_INTERNAL" && exit 1;  else echo "Service url is: $APP_URL_INTERNAL" ; fi
if [ -z $BRANCH_NAME ]; then echo "missing BRANCH_NAME" && exit 1;  else echo "Branch name is : $BRANCH_NAME" ; fi

# Run load env script
export ENVIRONMENT=sandbox
TEMP_BRANCH_NAME=$BRANCH_NAME
TEMP_APP_URL_INTERNAL=$APP_URL_INTERNAL
export CI_JOB_STAGE=deploy-local-qa
source ./config/loadEnv.sh


# Overriding environment variables
BRANCH_NAME=$TEMP_BRANCH_NAME
APP_URL_INTERNAL=$TEMP_APP_URL_INTERNAL
export APP_NAME=$BRANCH_NAME
export RISK_LIVE_URL=$APP_URL_INTERNAL
export RISK_SANDBOX_URL=$APP_URL_INTERNAL
export IAM_URL=http://internal.eks-qa.zooz.co/iam-api

SCRIPT_PATH=$(dirname $BASH_SOURCE)

export KONG_CONFIGURATIONS_AS_JOB_K8S_MIGRATION=docker-registry.zooz.co:4567/paymentsos/api-gateway/utilities/kong-admin-node-client/release:v4-latest
echo "KONG_CONFIGURATIONS_AS_JOB_K8S_MIGRATION $KONG_CONFIGURATIONS_AS_JOB_K8S_MIGRATION"

echo "destory existing kong configuration for branch $BRANCH_NAME"
export CONFIGURATION=$(node ./config/kong/remove-api-from-kong.js)
export EXECUTION_TYPE='delete'

echo $?
if [ -z "$CONFIGURATION" ]; then
    echo "unable to locate destroy configuration for kong" && exit 1
fi

./config/local/dockerRun.sh --kong-configurations-as-job || exit 1

echo "setup kong configuration"
export CONFIGURATION=$(node ./config/local/kong-setup-local.js)
export EXECUTION_TYPE='create'

echo $?
if [ -z "$CONFIGURATION" ]; then
    echo "unable to locate configuration for kong" && exit 1
fi

BRANCH_NAME=$TEMP_BRANCH_NAME
APP_URL_INTERNAL=$TEMP_APP_URL_INTERNAL

./config/local/dockerRun.sh --kong-configurations-as-job || exit 1

echo "Start service locally"
./config/local/runServiceLocally.sh
