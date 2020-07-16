#!/bin/bash -e
function isReview() {
    [[ $CI_COMMIT_REF_NAME = "master" || $CI_COMMIT_TAG ]] && echo false || echo true
}

function loadKongConfig() {
    echo "Loading kong configurations..."

    export SERVICES_IAM_SECRET_PATH=secret/serviceiam/riskanalysisgateway

    if [[ $(isReview) == true ]]; then
        export CHART_NAME=$(echo review-$SERVICE_NAME-$CI_COMMIT_REF_SLUG | cut -c1-55)
        export RISK_LIVE_URL=http://$CHART_NAME-service
        export RISK_SANDBOX_URL=http://$CHART_NAME-service
        export BRANCH_NAME=$CI_COMMIT_REF_NAME
        export APP_NAME=$CI_COMMIT_REF_NAME-$APP_NAME
    else
        export RISK_LIVE_URL=http://live-risk-gateway-service
        export RISK_SANDBOX_URL=http://sandbox-risk-gateway-service
    fi

    if [[ $CI_JOB_NAME == *":kong:stop" ]]; then
        export IAM_PASSWORD=T3st0X!2bzo
        export IAM_USERNAME=first.admin@zooz.com
        export CONFIGURATION=$(node $PWD/config/kong/remove-api-from-kong.js)
    else
        export CONFIGURATION=$(node $PWD/config/kong/kong-configurations-for-job.js)
    fi

    echo "* Kong configuration *"
    echo "RISK_LIVE_URL $RISK_LIVE_URL"
    echo "RISK_SANDBOX_URL $RISK_SANDBOX_URL"
    echo "IAM_SERVICE_URL $IAM_SERVICE_URL"
    echo "SERVICES_IAM_SECRET_PATH $SERVICES_IAM_SECRET_PATH"
    echo "KONG_ADMIN_URL $KONG_ADMIN_URL"
    echo "KONG_CONFIG_SECRET_PROJECT $KONG_CONFIG_SECRET_PROJECT"
}

loadKongConfig
