# Load Tester

Uma ferramenta de teste de carga desenvolvida em TypeScript/Node.js que permite enviar requisições HTTP(S) de forma concorrente para um endpoint, coletando estatísticas como tempo total, tempo até o primeiro byte e tempo entre o primeiro e o último byte. A aplicação suporta múltiplos métodos HTTP (GET, POST, PUT, DELETE, etc.) e possibilita o envio de um body para requisições que o suportem, tudo via um ambiente interativo (REPL).

## Features

- **Suporte a Múltiplos Métodos HTTP:** Permite testar endpoints com GET, POST, PUT, DELETE e outros.
- **Envio de Body:** Possibilita enviar um payload (JSON ou outro) em requisições (ex.: POST).
- **Estatísticas de Requisições:** Coleta e exibe:
  - Tempo total da requisição
  - Tempo até o primeiro byte
  - Tempo entre o primeiro e o último byte
- **Ambiente Interativo (REPL):** Execute testes diretamente via linha de comando.
- **Relatório Resumido:** Exibe contagem de requisições bem-sucedidas, falhas e taxa de requisições por segundo.
- **Suporte a Redirecionamentos:** Utiliza o módulo [follow-redirects](https://www.npmjs.com/package/follow-redirects) para lidar com redirecionamentos automaticamente.
- **Execução via Docker:** Contém um Dockerfile para facilitar a execução do projeto em containers.

## Requisitos

- Node.js (versão 16 ou superior)
- npm
- (Opcional) Docker, se preferir rodar a aplicação via container

## Instalação

1. Clone o repositório:

   ```bash
   git clone <https://github.com/luisfelix-93/load-tester>
   cd load-tester
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Compile o projeto (caso não utilize o ts-node):
   ```bash
   npm run build
   ```
## Uso
### Execução local
- Para iniciar, execute:
  ```bash
  npm run start
  ```
Isso iniciará o ambiente interativo (REPL) com o prompt ccload$.
#### Exemplos de comando
  - **Teste com GET:**
  ```bash
  -u https://localhost:8000 -n 100 -c 10
  ```
  - **Teste com POST:**
  ```bash
  -u https://localhost:8000/api -n 50 -c 5 -m POST -b '{"nome":"valor"}'
  ```
  - **Exibir ajuda:**
  ```bash
  help
  ```
  - **Sair da aplicação:**
  ```bash
  exit
  ```
### Execução via Docker
Um Dockerfile está incluído para facilitar a execução da aplicação em container.

  - **Construa a imagem Docker:**
  ```bash
  docker build -t load-tester .
  ```

  - **Execute o container de forma interativa:**
  ```bash
  docker run -it load-tester
  ```
Isso abrirá o REPL dentro do container, permitindo que você teste os endpoints conforme os exemplos acima.

# Contribuição

Sinta-se à vontade para abrir issues ou enviar pull requests para contribuir com melhorias ou novas funcionalidades.