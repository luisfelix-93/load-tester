#!/bin/bash

set -e

echo "🔍 Verificando se Docker está instalado..."
if ! command -v docker &> /dev/null
then
    echo "❌ Docker não encontrado. Instale o Docker antes de continuar."
    exit 1
fi

echo "✅ Docker encontrado."

echo "🔍 Verificando status do Docker Swarm..."
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"
then
    echo "⚠️ Docker Swarm não está ativo. Inicializando Swarm..."
    docker swarm init
fi

echo "✅ Docker Swarm está ativo."

echo "📦 Criando stack.yaml..."

cat > stack.yaml <<EOF
version: '3.8'
services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.25'
          memory: 256M
        limits:
          cpus: '2'
          memory: 2G
  
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.5'
          memory: 256M

  loadtest-api:
    image: luisffilho/load-tester-api:20250818
    environment:
      - API_PORT=4000
      - REDIS_PORT=6379
      - REDIS_HOST=redis
      - MONGODB_URI=mongodb://mongo:27017/load-tester-db
    ports:
      - "4000:4000"
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.5'
          memory: 256M

  loadtest-worker:
    image: luisffilho/load-tester-worker:20250818
    environment:
      - REDIS_PORT=6379
      - REDIS_HOST=redis
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.5'
          memory: 256M

  loadtest-app:
    image: luisffilho/load-tester-app:20250813
    ports:
      - "5173:5173"
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.25'
          memory: 256M

  orchestrator-api:
    image: luisffilho/health-check-api:20250819
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/health-check-db
      - REDIS_ROST=redis
      - REDIS_PORT=6379
      - CRON_SCHEDULE=*/5 * * * *
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.5'
          memory: 256M

  worker-api:
    image: luisffilho/health-check-worker:latest
    environment:
      - REDIS_PORT=6379
      - REDIS_HOST=redis
    ports:
      - '3001:3001'
    networks:
      - loadtest-net
    deploy:
      resources:
        reservations:
          cpus: '0.1'
          memory: 128M
        limits:
          cpus: '0.5'
          memory: 256M

networks:
  loadtest-net:
    driver: overlay
EOF

echo "🚀 Implantando a stack no Docker Swarm..."
docker stack deploy -c stack.yaml loadtester

echo "✅ Aplicação implantada com sucesso. Verifique o status com 'docker stack ps loadtester'"
echo "✅ Aplicação disponível em: http://localhost:5173"
