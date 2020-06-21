#!/bin/bash

echo Setting source all centralized-config in current eks cluster
sleep 15
for s in $(echo $values | kubectl get configmap centralized-config -o json | jq .data | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ); do
    export $s
done

export KONG_ADMIN_URL="${KONG_PCI_URL}/admin"
export APPS_STORAGE_URL_LIVE=$APPLICATION_STORAGE_LIVE_URL
export APPS_STORAGE_URL_TEST=$APPLICATION_STORAGE_TEST_URL

if [[ $CLUSTER = dev ]]; then
    export IAM_SERVICE_URL=$IAM_SERVICE_URL_MOCK
fi

echo "**ENVIRONMENT VARIABLES**"
echo "KONG_ADMIN_URL: $KONG_ADMIN_URL"
echo "IAM_SERVICE_URL: $IAM_SERVICE_URL"
