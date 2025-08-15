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
services:
  mongo:
    image: mongo:latest
    container_name: mongo
    ports:
      - "27017:27017"
    networks:
      - loadtest-net
  
  redis:
    image: redis:latest
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - loadtest-net

  loadtest-api:
    image: luisffilho/load-tester-api:latest
    container_name: loadtest-api
    environment:
      - API_PORT=4000
      - REDIS_PORT=6379
      - REDIS_HOST=redis
      - MONGODB_URI=mongodb://mongo:27017/load-tester-db
    ports:
      - "4000:4000"
    networks:
      - loadtest-net
    depends_on:
      - mongo
      - redis
  loadtest-worker:
    image: luisffilho/load-tester-worker:latest
    container_name: loadtest-worker
    environment:
      - REDIS_PORT=6379
      - REDIS_HOST=redis
    networks:
      - loadtest-net
    depends_on:
      - redis
      - loadtest-api
  loadtest-app:
    image: luisffilho/load-tester-app:latest
    container_name: loadtest-app
    ports:
      - "5173:5173"
    networks:
      - loadtest-net
    depends_on:
      - loadtest-api
  orchestrator-api:
    image: luisffilho/health-check-api:latest
    container_name: orchestator-api
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/health-check-db
      - REDIS_ROST=redis
      - REDIS_PORT=6379
      - CRON_SCHEDULE=*/1 * * * *
    networks:
      - loadtest-net
    depends_on:
      - mongo
      - redis
  worker-api:
    image: luisffilho/health-check-worker:latest
    container_name: worker-api
    environment:
      - REDIS_PORT=6379
      - REDIS_HOST=redis
    ports:
      - '3001:3001'


    networks:
      - loadtest-net
    depends_on:
      - redis
networks:
  loadtest-net:
    driver: bridge
EOF

echo "🚀 Subindo containers..."
docker compose up -d

echo "✅ Aplicação disponível em: http://localhost:5173"
