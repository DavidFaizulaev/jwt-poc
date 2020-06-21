#!/bin/bash -e
if [ $1 ];then
    export CLUSTER=$1
elif [ -z "$CLUSTER" ];then
    export CLUSTER=$CI_ENVIRONMENT_NAME
fi

# Get to the project's root directory
# while [ ! -f package.json ];do cd ..; done

function setLocalEnvVars() {
    isLocalApp
    setCommitRef
    setRegistry
}

function setCommonEnvVars() {
    export SERVICE_NAME=risk-gateway
    export IS_REVIEW=$(isReview)
    export APP_NAME=$(getAppName)
    export BRANCH_NAME=$(getBranchName)
    export BUILD=$(getBuild)
    export CLUSTER=$(getCluster)
    export APP_IMAGE=$(getAppImage)
    export DOCKER_URI=$(getDockerUri)
    export CASSANDRA_KEYSPACE=$(getKeyspace)
    export CASSANDRA_MIGRATION_IMAGE=$(getCassandraImage)
    export KONG_CONFIGURATIONS_AS_JOB_K8S_MIGRATION=docker-registry.zooz.co:4567/paymentsos/api-gateway/utilities/kong-admin-node-client/release:v4-latest

    export CASSANDRA_REPLICATION_FACTOR=3
    export SECRETS_FILE_PATH="/var/share/secrets/vault_secrets/secrets.json"
    export SECRET_MANAGER_PROJECT_NAME=riskgateway
    export CASSANDRA_LOCAL_DATA_CENTER=eu-central
    export PULL_POLICY=Always

    export KEEP_ALIVE_TIMEOUT=120000

    reportEnvVars
}

function getKeyspace() {
    if [[ "$ENVIRONMENT" == sandbox ]]; then
        echo risk_gateway_sandbox
    else
        echo risk_gateway_live
    fi
}

function isMacOS() {
    [ $(uname) = "Darwin" ] && echo true || echo false
}

function setCommitRef() {
    if [[ $(isMacOS) == true ]];then
        export CI_COMMIT_REF_NAME=$(cat .git/HEAD | cut -d'/' -f3)
    fi
}

function setRegistry() {
    if [[ $(isMacOS) == true ]];then
        CI_REGISTRY_IMAGE=$(cat .git/config | grep "url =" | cut -d'=' -f2 | sed 's| git@git.zooz.co:|docker-registry.zooz.co:4567/|' | sed 's|\.git||')
        export CI_REGISTRY_IMAGE=$(toLowerCase $CI_REGISTRY_IMAGE)
    fi
}

function isReview() {
    [[ $CI_COMMIT_REF_NAME = "master" || $CI_COMMIT_TAG ]] && echo false || echo true
}

function getAppName() {
    if [ $CI_PROJECT_NAME ];then
        echo $(toLowerCase $CI_PROJECT_NAME)
    else
        echo $(cat .git/config | grep "url =" | rev | cut -d'/' -f1 | rev | cut -d'.' -f1)
    fi
}

function getBranchName() {
    if [ $CI_COMMIT_REF_NAME != master ] && [[ -z "$CI_COMMIT_TAG" ]];then
        echo $CI_COMMIT_REF_NAME
    fi
}

function getBuild() {
    if [[ $CI_COMMIT_REF_NAME = master ]]; then
        echo $CI_PIPELINE_ID
    else
        echo $CI_COMMIT_REF_NAME
    fi
}

function getAppImage() {
    # App image
    if [[ $CI_COMMIT_REF_NAME = master ]]; then
        echo $CI_REGISTRY_IMAGE/master:$CI_PIPELINE_ID
    elif [[ $CI_COMMIT_TAG ]]; then
        echo $CI_REGISTRY_IMAGE/tags:$CI_COMMIT_REF_NAME
    else
        echo $CI_REGISTRY_IMAGE/branches:$CI_COMMIT_REF_NAME
    fi
}

function getCassandraImage() {
    export CM_VERSION=1
    if [[ $CI_COMMIT_REF_NAME = master ]]; then
        echo $CI_REGISTRY_IMAGE/master:cm-$CM_VERSION
    elif [[ $CI_COMMIT_TAG ]]; then
        echo $CI_REGISTRY_IMAGE/tags:cm-$CM_VERSION
    else
        echo $CI_REGISTRY_IMAGE/branches:cm-$CM_VERSION
    fi
}

function setVirtualServiceVariables() {
    export VIRTUAL_SERVICE_PREFIX=$CHART_NAME
    export VIRTUAL_SERVICE_METADATA_NAME=$VIRTUAL_SERVICE_PREFIX-internal-virtual-service
    export VIRTUAL_SERVICE_URI_PREFIX=$VIRTUAL_SERVICE_PREFIX
    export VIRTUAL_SERVICE_DESTINATION_HOST=$VIRTUAL_SERVICE_PREFIX-service.apps.svc.cluster.local
}

function getCluster() {
    if  [[ "$CLUSTER" = review/dev* ]];then
        echo dev
    elif  [[ "$CLUSTER" = review/qa* ]];then
        echo qa
    else
        echo $(toLowerCase $(echo $CLUSTER | cut -d "-" -f1))
    fi
}

function getDockerUri() {
  if  [[ "$CLUSTER" = prd ]];then
    echo https://s3.eu-central-1.amazonaws.com/zooz-marathon-assets-prod/docker.tar.gz
  else
    echo https://s3.eu-central-1.amazonaws.com/zooz-marathon-assets/docker.tar.gz
  fi
}

function reportEnvVars() {
    echo "************************************************"
    echo "*        Loading common variables"
    echo "************************************************"
    echo APP_NAME=$APP_NAME
    echo BRANCH_NAME=$BRANCH_NAME
    echo BUILD=$BUILD
    echo APP_IMAGE=$APP_IMAGE
    echo DOCKER_IP=$DOCKER_IP
    echo CLUSTER=$CLUSTER
    echo ENV=$ENV
    echo IS_REVIEW=$IS_REVIEW
    echo ENVIRONMENT=$ENVIRONMENT
    echo "* K8S *"
    echo "CHART_NAME: $CHART_NAME"
    echo "VIRTUAL_SERVICE_PREFIX: $VIRTUAL_SERVICE_PREFIX"
    echo "VIRTUAL_SERVICE_METADATA_NAME: $VIRTUAL_SERVICE_METADATA_NAME"
    echo "VIRTUAL_SERVICE_URI_PREFIX: $VIRTUAL_SERVICE_URI_PREFIX"
    echo "VIRTUAL_SERVICE_DESTINATION_HOST: $VIRTUAL_SERVICE_DESTINATION_HOST"
    echo "SECRETS_FILE_PATH: $SECRETS_FILE_PATH"
    echo "K8S_SERVICE_URL: $K8S_SERVICE_URL"
    echo "KEEP_ALIVE_TIMEOUT: $KEEP_ALIVE_TIMEOUT"
}

function loadClusterVars() {
    echo "************************************************"
    echo "*        Loading cluster specific variables"
    echo "************************************************"

    if [ -f config/env/$ENVIRONMENT/$CI_JOB_STAGE.sh ];then
        source config/env/$ENVIRONMENT/$CI_JOB_STAGE.sh
    fi
}

function toLowerCase() {
    echo $(echo $1 | tr '[:upper:]' '[:lower:]')
}

function isLocalApp() {
    if [[ $(isMacOS) == true ]];then
        echo "MacOS machine detected. Should I use local application address for tests? (Y/n)"
        read ANS
        [ "$ANS" != "n" ] && export LOCAL_APP=true || export LOCAL_APP=false
    fi
}

function setChartName() {
    if [[ $(isReview) == true ]]; then
        export CHART_NAME=$(echo review-$SERVICE_NAME-$CI_COMMIT_REF_SLUG | cut -c1-55)
    else
        export CHART_NAME=$ENVIRONMENT-$SERVICE_NAME
    fi
}

setLocalEnvVars
setCommonEnvVars
setChartName
setVirtualServiceVariables
loadClusterVars
