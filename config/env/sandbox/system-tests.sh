# App
export PORT=3000
export SHUTDOWN_TIMEOUT=10000

if [[ $IS_REVIEW == true ]];then
    export SERVICE_NAME=$(echo review-$SERVICE_NAME-$CI_COMMIT_REF_SLUG | cut -c1-55)
fi

export APP_URL=http://internal.eks-dev.zooz.co/$SERVICE_NAME

echo PORT: $PORT
echo SHUTDOWN_TIMEOUT: $SHUTDOWN_TIMEOUT
echo APP_URL: $APP_URL
export CLUSTER=qa
