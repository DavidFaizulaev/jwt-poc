# Deployment
echo Loading Deploy production stage environment variables
export MEMORY=256
export CPUS=0.25
export INSTANCES=2

export FRAUD_SERVICE_URL=http://{SERVICE_NAME}-service

echo MEMORY=$$MEMORY
echo CPUS=$CPUS
echo INSTANCES=$INSTANCES
export CLUSTER=prd
