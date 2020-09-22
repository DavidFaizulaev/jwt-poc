# Deployment
echo Loading Deploy qa stage environment variables
export MEMORY=128
export CPUS=0.1
export INSTANCES=1

# K8S_SERVICE_URL
export FRAUD_SERVICE_URL=http://internal.eks-qa.zooz.co/{SERVICE_NAME}

echo MEMORY=$MEMORY
echo CPUS=$CPUS
echo INSTANCES=$INSTANCES
export CLUSTER=qa
