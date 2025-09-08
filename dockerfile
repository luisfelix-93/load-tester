# Etapa 1: Construir a aplicação frontend
FROM node:18-alpine AS frontend_build
WORKDIR /app

# Copia os arquivos de pacote e instala as dependências
COPY ./load-tester-app/package.json ./load-tester-app/package-lock.json* ./
RUN npm install

# Copia o código-fonte do frontend e o compila
COPY ./load-tester-app/ ./
RUN npm run build

# Etapa 2: Configurar o Nginx
FROM nginx:alpine

# Copia os arquivos estáticos construídos da etapa anterior
COPY --from=frontend_build /app/dist /usr/share/nginx/html

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração personalizada do gateway
COPY ./api-gateway/config/nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 para tráfego HTTP
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]