# External Services:
export PAYMENTS_OS_BASE_URL=https://api-qa.paymentsos.com
export EXTERNAL_ENVIRONMENT=test
export ORIGIN_URL=https://control-qa.paymentsos.com/
export PAYMENTS_OS_BASE_URL_FOR_TESTS=https://api-qa.paymentsos.com/$BRANCH_NAME
export TOKEN_STATE_MACHINE_URL=http://internal.eks-qa.zooz.co/sandbox-token-state-machine

echo "PAYMENTS_OS_BASE_URL: $PAYMENTS_OS_BASE_URL"
echo "PAYMENTS_OS_BASE_URL_FOR_TESTS: $PAYMENTS_OS_BASE_URL_FOR_TESTS"
echo "ORIGIN_URL: $ORIGIN_URL"
