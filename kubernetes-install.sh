#!/bin/bash

# Script to install the load-tester application in a Kubernetes cluster
# by downloading the manifests directly from the GitHub repository.

# Base URL for raw files from the GitHub repository.
GITHUB_RAW_URL="https://raw.githubusercontent.com/luisfelix-93/load-tester/prod"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null
then
    echo "kubectl not found. Please install it to continue."
    exit
fi

# Check if kind is installed
if ! command -v kind &> /dev/null
then
    echo "kind not found. Please install it to continue."
    exit
fi

# Create a kind cluster
if ! kind get clusters | grep -q "load-tester"; then
    echo "Creating kind cluster..."
    kind create cluster --name load-tester
else
    echo "Kind cluster 'load-tester' already exists."
fi
echo "Creating the kubernetes-dashboard namespace ..."

kubectl create namespace kubernetes-dashboard

echo "Applying Kubernetes manifests from ${GITHUB_RAW_URL}..."


# List of manifests to be applied in the correct order.
MANIFESTS=(
    "manifests/dashboard-adminuser.yaml"
    "manifests/mongo-service.yaml"
    "manifests/redis-service.yaml"
    "manifests/api-service.yaml"
    "manifests/orchestrator-api-service.yaml"
    "manifests/worker-api-service.yaml"
    "manifests/frontend-service.yaml"
    "manifests/mongo-deployment.yaml"
    "manifests/redis-deployment.yaml"
    "manifests/api-deployment.yaml"
    "manifests/orchestrator-api-deployment.yaml"
    "manifests/worker-api-deployment.yaml"
    "manifests/loadtest-worker-deployment.yaml"
    "manifests/frontend-deployment.yaml"
    "manifests/loadtest-worker-hpa.yaml"
    "manifests/dns-cert-deployment.yaml"
    "manifests/dns-cert-service.yaml"
)

# Iterate over the list and apply each manifest.
for manifest in "${MANIFESTS[@]}"; do
    URL="${GITHUB_RAW_URL}/${manifest}"
    echo "Applying ${URL}..."
    kubectl apply -f "${URL}"
    # Check if the command was successful
    if [ $? -ne 0 ]; then
        echo "Error applying manifest ${URL}. Aborting."
        exit 1
    fi
done

kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
kubectl proxy
echo ""
echo "Waiting for deployments to be ready..."

kubectl rollout status deployment/loadtest-app


echo ""
echo "Installation script finished."
echo "Use 'kubectl get pods' to check the status of the pods."
echo "Use 'kubectl get services' to see the exposed services."

# Kill any existing port-forward processes
echo "Killing existing port-forward processes..."
pkill -f "kubectl port-forward" || true

echo "Starting port-forwarding..."

# Port-forward for services in the background
kubectl port-forward service/loadtest-app-svc 5173:5173 &

echo "✅ Application available at: http://localhost:5173"