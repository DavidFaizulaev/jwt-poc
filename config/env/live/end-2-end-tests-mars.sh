# External Services:
export PAYMENTS_OS_BASE_URL=https://api-mars.paymentsos.com
export EXTERNAL_ENVIRONMENT=live
export ORIGIN_URL=https://control-mars.paymentsos.com
export PAYMENTS_OS_BASE_URL_FOR_TESTS=https://api-mars.paymentsos.com/$BRANCH_NAME
export TOKEN_STATE_MACHINE_URL=http://internal.eks-mars-apps.zooz.co/live-token-state-machine
export SERVICE_URL=http://internal.eks-mars-pci.zooz.co/$CHART_NAME

echo "PAYMENTS_OS_BASE_URL: $PAYMENTS_OS_BASE_URL"
echo "PAYMENTS_OS_BASE_URL_FOR_TESTS: $PAYMENTS_OS_BASE_URL_FOR_TESTS"
echo "ORIGIN_URL: $ORIGIN_URL"
echo "SERVICE_URL: $SERVICE_URL"