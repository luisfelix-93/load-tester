#!/bin/bash

set -e

echo "🔍 Verificando se Docker está instalado..."
if ! command -v docker &> /dev/null
then
    echo "❌ Docker não encontrado. Instale o Docker antes de continuar."
    exit 1
fi

echo "🔍 Verificando se Docker Compose está instalado..."
if ! docker compose version &> /dev/null
then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose v2 (docker compose)."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados."

echo "📦 Criando docker-compose.yml..."

cat > docker-compose.yml <<EOF
version: '3.9'
services:
  loadtest-api:
    image: luisffilho/load-tester-api:latest
    container_name: loadtest-api
    ports:
      - "4000:4000"
    networks:
      - loadtest-net

  loadtest-app:
    image: luisffilho/load-tester-app:latest
    container_name: loadtest-app
    ports:
      - "5173:5173"
    networks:
      - loadtest-net
    depends_on:
      - loadtest-api

networks:
  loadtest-net:
    driver: bridge
EOF

echo "🚀 Subindo containers..."
docker compose up -d

echo "✅ Aplicação disponível em: http://localhost:5173"
