# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de configuração e instala as dependências
COPY package*.json ./
RUN npm install && npm install -g typescript

# Copia o restante do código fonte e compila o TypeScript
COPY . .
RUN npm run build

# Etapa final: cria a imagem de produção
FROM node:18-alpine

WORKDIR /app

# Copia os arquivos compilados, package.json e os node_modules do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Configuração para permitir modo interativo
ENTRYPOINT ["npm", "start"]
