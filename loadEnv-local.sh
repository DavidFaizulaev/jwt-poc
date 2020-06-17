#!/bin/bash -e
if [ -z $BASH_VERSION ];then
    BASH_SOURCE=$0:A
fi

PROJECT_ROOT=$(dirname $BASH_SOURCE)
export ENVIRONMENT=sandbox
export NEW_CONNECTIONS_TIMEOUT=1
export SHUTDOWN_TIMEOUT=1

source $PROJECT_ROOT/config/loadEnv.sh