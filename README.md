# 💫 Load Tester - Ferramenta de Teste de Carga

Este projeto é uma aplicação de teste de carga desenvolvida com **React**, **TypeScript**, **TailwindCSS** e **ShadCN UI** no frontend, e uma API em **Node.js**/**TypeScript** no backend.

A ferramenta permite enviar um número configurável de requisições HTTP para uma URL alvo e visualizar estatísticas e gráficos de desempenho.

---

## ✨ Funcionalidades

- Configuração personalizada de:
  - URL alvo
  - Número de requisições
  - Nível de concorrência
  - Método (GET/POST) e envio de payload JSON
- Exibição de resultados:
  - Número de sucessos e falhas
  - Tempo total de resposta (mínimo, médio e máximo)
  - Tempo para o primeiro e último byte
- Gráficos:
  - Status code por requisição (pizza)
  - Tempo de resposta por requisição (linha)
  - Histograma dos tempos de resposta
  - Tempo médio por status code (barras)
- Relatórios:
  - Visualização interativa em páginas de relatório com rolagem vertical (snap)
  - Exportação dos resultados como JSON
  - Busca de relatórios por intervalo de datas
- Interface responsiva e moderna com **TailwindCSS** + **ShadCN UI**

---

## 📦 Tecnologias Utilizadas

- **Frontend**
  - React + Vite
  - TypeScript
  - TailwindCSS
  - ShadCN UI
  - Axios (para chamadas HTTP)
  - React Router DOM (navegação)
  - Chart.js + react-chartjs-2 (gráficos)
  - FileSaver (exportação JSON)

- **Backend**
  - Node.js
  - TypeScript
  - Express
  - Load testing engine próprio

---

## 🚀 🐳 Rodando o Projeto com o Docker Compose

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (obrigatório)

---

Você pode subir toda a stack (frontend + backend) facilmente usando Docker Compose:

```bash
docker compose up -d
```

Ou, se preferir, execute o script automatizado diretamente do GitHub:

```bash
curl -sSL https://raw.githubusercontent.com/luisfelix-93/load-tester/prod/loadtester-install.sh | bash
```

Após a execução, acesse a aplicação em: [http://localhost:5173](http://localhost:5173)

## ☸️ Rodando com Kubernetes

Além do Docker Compose, você pode rodar a aplicação em um cluster Kubernetes usando os manifests prontos na pasta `k8s-manifests`.

### Pré-requisitos

- [kubectl](https://kubernetes.io/docs/tasks/tools/) configurado
- Um cluster Kubernetes (local ou cloud)

### Passos

1. Acesse a pasta dos manifests:
   ```bash
   cd k8s-manifests
   ```

2. Aplique todos os manifests:
   ```bash
   kubectl apply -f .
   ```

   Isso irá criar os deployments e services para o backend (API) e frontend.

3. Exponha o frontend para acesso externo (exemplo usando port-forward):
   ```bash
   kubectl port-forward svc/loadtest-app-svc 5173:5173
   ```
   Agora acesse a aplicação em [http://localhost:5173](http://localhost:5173).

> **Obs:** Se quiser expor via LoadBalancer ou Ingress, ajuste o tipo do Service conforme sua infraestrutura.

### Estrutura dos manifests

- `api-deployment.yaml` — Deployment do backend (API)
- `api-service.yaml` — Service do backend (API)
- `frontend-deployment.yaml` — Deployment do frontend (App)
- `frontend-service.yaml` — Service do frontend (App)

---

Pronto! Agora sua documentação cobre tanto Docker Compose quanto Kubernetes.

## 🖥️ Estrutura do Frontend

```
src/
 ├── api/               # Serviços de chamada HTTP (ex: loadtester.ts)
 ├── components/        # Componentes reutilizáveis (Cards, Charts, Layout, etc.)
 │    ├── AverageTimeByStatusChart/
 │    ├── Layout/
 │    ├── NavBar/
 │    └── ...
 ├── lib/               # Funções utilitárias (ex: utils.ts)
 ├── pages/             # Páginas principais do app
 │    ├── DetalheResumo/
 │    ├── Error/
 │    ├── Home/
 │    ├── Loading/
 │    ├── Relatorios/
 │    ├── Resumo/
 │    └── Teste/
 ├── App.tsx            # Configuração de rotas
 └── main.tsx           # Ponto de entrada do app
```

---
## Estrutura do Backend

O projeto segue uma arquitetura modular, separando responsabilidades em camadas para facilitar manutenção, testes e extensibilidade. Abaixo está um resumo dos principais diretórios e arquivos:

```
src/
├── controllers/
│   └── runLoadTest.controller.ts      # Lida com as requisições HTTP e respostas
├── routes/
│   └── loadTest.route.ts              # Define as rotas da API
├── services/
│   └── LoadTestService.ts             # Regras de negócio e interface com o repositório
├── usecases/
│   └── runLoadTest.usecase.ts         # Caso de uso principal: executa o teste de carga
├── infrastructure/
│   ├── interfaces/
│   │   └── ILoadTest.ts               # Interface do modelo de teste de carga
│   └── repositories/
│       └── LoadTestRepository.ts      # Implementação em memória do repositório de testes
├── utils/
│   ├── makeRequest.ts                 # Função utilitária para executar requisições HTTP/HTTPS
│   └── calcStats.ts                   # Função utilitária para calcular estatísticas dos testes
├── server.ts                          # Ponto de entrada da aplicação Express
```

### Camadas principais

- **Controllers:** Recebem as requisições HTTP, validam parâmetros e retornam respostas apropriadas.
- **Routes:** Mapeiam os endpoints da API para os métodos dos controllers.
- **Services:** Contêm a lógica de negócio e interagem com os repositórios.
- **UseCases:** Implementam fluxos de negócio específicos (ex: executar um teste de carga).
- **Infrastructure:** Define interfaces e implementações de persistência (ex: repositório em memória).
- **Utils:** Funções auxiliares para requisições HTTP e cálculo de métricas.

### Fluxo de uma requisição

1. **Rota** recebe a requisição e direciona para o controller.
2. **Controller** valida os dados e chama o use case ou service apropriado.
3. **UseCase** executa o fluxo de negócio (ex: realiza múltiplas requisições de carga).
4. **Service** pode salvar ou buscar dados do **repositório**.
5. **Repository** armazena os dados em memória (pode ser adaptado para banco de dados futuramente).
6. **Utils** são usadas para tarefas como enviar requisições HTTP e calcular estatísticas.

---

Essa estrutura facilita a escalabilidade e a testabilidade do projeto, permitindo evoluir para bancos de dados reais ou adicionar novas funcionalidades com facilidade.

## 📈 Fluxo de Uso

1. Acesse a página inicial.
2. Informe a URL alvo, o número de requisições, concorrência, método (GET/POST) e payload (se POST).
3. Inicie o teste.
4. Veja o resumo dos resultados, incluindo gráficos de desempenho.
5. Navegue pelos relatórios anteriores ou busque por intervalo de datas.
6. Exporte os resultados como JSON, se desejar.

---

## 🛠️ Melhorias Futuras

- Exportação dos resultados em CSV
- Suporte a autenticação (JWT, Basic Auth)
- Implementação de filas de teste para múltiplos usuários
- Filtros avançados nos relatórios

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.  
Sinta-se livre para usar, modificar e contribuir!

---

# ⚡ Desenvolvido por

Luis Felipe Felix Filho  
[LinkedIn](https://www.linkedin.com/in/luis-felix-filho/) • [GitHub](https://github.com/luisfelix-93)

---

## Badges

```markdown
![React](https://img.shields.io/badge/React-19.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
```

