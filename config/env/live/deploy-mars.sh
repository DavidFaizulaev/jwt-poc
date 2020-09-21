# Deployment
echo Loading Deploy mars stage environment variables
export MEMORY=256
export CPUS=0.1
export INSTANCES=1

# K8S_SERVICE_URL
export FRAUD_SERVICE_URL=http://{SERVICE_NAME}-service

echo MEMORY=$MEMORY
echo CPUS=$CPUS
echo INSTANCES=$INSTANCES
export CLUSTER=mars
