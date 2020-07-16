#!/bin/bash

echo Going source all centralized-config in current eks cluster
sleep 15
for s in $(echo $values | kubectl get configmap centralized-config -o json | jq .data | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ); do
    export $s
done

export PAYMENT_STORAGE_URL=$PAYMENT_STORAGE_TEST
export APPS_STORAGE_URL=$APPLICATION_STORAGE_TEST_URL

echo "**ENVIRONMENT VARIABLES**"
echo "PAYMENT_STORAGE_URL: $PAYMENT_STORAGE_URL"
echo "APPS_STORAGE_URL: $APPS_STORAGE_URL"
