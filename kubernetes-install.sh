#!/bin/bash

# Script para instalar a aplicação load-tester em um cluster Kubernetes
# baixando os manifestos diretamente do repositório GitHub.

# URL base para os arquivos raw do repositório GitHub.
GITHUB_RAW_URL="https://raw.githubusercontent.com/luisfelix-93/load-tester/v2"

# Verifica se o kubectl está instalado
if ! command -v kubectl &> /dev/null
then
    echo "kubectl não foi encontrado. Por favor, instale-o para continuar."
    exit
fi

echo "Aplicando os manifestos Kubernetes a partir de ${GITHUB_RAW_URL}..."

# Lista de manifestos a serem aplicados na ordem correta.
MANIFESTS=(
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
)

# Itera sobre a lista e aplica cada manifesto.
for manifest in "${MANIFESTS[@]}"; do
    URL="${GITHUB_RAW_URL}/${manifest}"
    echo "Aplicando ${URL}..."
    kubectl apply -f "${URL}"
    # Verifica se o comando foi bem-sucedido
    if [ $? -ne 0 ]; then
        echo "Erro ao aplicar o manifesto ${URL}. Abortando."
        exit 1
    fi
done

echo ""
echo "Script de instalação finalizado."
echo "Use 'kubectl get pods' para verificar o status dos pods."
echo "Use 'kubectl get services' para ver os serviços expostos."
echo "✅ Aplicação disponível em: http://localhost:5173"
