#!/bin/bash
mkdir logs

function waitForApp() {
    container=$1
    grepBy=$2
    docker logs -f "$container" > logs/$APP-$(date +%Y%m%d-%H%M%S).log &

    HEALTH_CHECK_TIMEOUT=40;
    HEALTH_CHECK_INTERVAL=1;
    started=

    while [[ -z $started && $HEALTH_CHECK_TIMEOUT -gt 0 ]]; do
        started=$(docker logs "$container" | grep "$grepBy" 2>/dev/null)
        let HEALTH_CHECK_TIMEOUT=$HEALTH_CHECK_TIMEOUT-1
        sleep $HEALTH_CHECK_INTERVAL
    done

    if [[ -z $started ]];then
        echo "Couldn't start the application on time"
        docker logs $container
        exit 1
    fi
}

function kong-configurations-as-job() {
    APP=kong-configurations-as-job
    COMMAND="docker run \
            -e CONFIGURATION=$CONFIGURATION \
            -e KONG_ADMIN_URL=$KONG_ADMIN_URL \
            -e IAM_USERNAME=$IAM_USERNAME \
            -e IAM_PASSWORD=$IAM_PASSWORD \
            -e IAM_URL_INTERNAL=$IAM_URL \
             $KONG_CONFIGURATIONS_AS_JOB_K8S_MIGRATION"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND
    COMMAND_EXIT_CODE=$?
    if [[ ${COMMAND_EXIT_CODE} != 0 && ${EXECUTION_TYPE} -eq 'delete' ]]; then
        printf "Error when executing: '${APP}'\n"
        exit 0
    elif [[ ${COMMAND_EXIT_CODE} != 0 ]]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi
}

function deleteContainer() {
    NAME=$1
    isExists=$(docker ps -af name=$NAME | grep -v IMAGE)
    if [ ! -z isExists ];then
        docker rm -f $NAME
    fi
}

if [[ ! $INIT ]];then
    docker login -u gitlab-ci-token -p $CI_BUILD_TOKEN $CI_REGISTRY
    export INIT=true
fi

for option in ${@}; do
    case $option in
    --kong-configurations-as-job)
        kong-configurations-as-job
        ;;
    *)
        echo "Usage: ./docker.sh <kong-configurations-as-job>"
        ;;
    esac
done

docker ps
