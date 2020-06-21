#!/bin/sh
set -e

if [ -z $BRANCH_NAME ]; then echo "missing BRANCH_NAME" && exit 1;  else echo "Branch name is : $BRANCH_NAME" ; fi

export ENVIRONMENT=sandbox
export CI_JOB_STAGE=deploy-local-qa
TEMP_BRANCH_NAME=$BRANCH_NAME

source ./config/loadEnv.sh
# Overriding environment variables
export APP_NAME=$TEMP_BRANCH_NAME
SCRIPT_PATH=$(dirname $BASH_SOURCE)

export IAM_URL=http://internal.eks-qa.zooz.co/iam-api

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
