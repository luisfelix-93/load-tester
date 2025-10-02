# 💫 Support.io

Support.io is a multifunctional platform designed to help developers and system administrators ensure the performance, reliability, and security of their web applications. Built with a microservices architecture, the project offers a set of tools integrated into a single interface.

---

## ✨ Architecture
### Load-Tester
The Load Tester is designed as a distributed system to separate concerns and improve scalability. The main components are:

*   **`load-tester-app` (Frontend & API Gateway):** A web interface built with React, Vite, and TypeScript. In addition to serving the user interface, this component includes an NGINX configuration that acts as an **API Gateway**. It reverse-proxies requests from the frontend to the appropriate backend services (`load-tester-api` and `orchestrator-api`), simplifying network configuration and centralizing access points.
*   **`load-tester-api` (API):** A Node.js/TypeScript backend that handles user requests, manages test configurations, and communicates with the worker.
*   **`load-tester-worker` (Worker):** A dedicated Node.js/TypeScript service that executes the load tests. This separation prevents the API from being blocked by long-running test jobs.

These core components are managed as Git submodules in this repository. For more detailed information about each component, please refer to the `README.md` inside its respective directory.

---
### Health-Check Monitor

In addition to the load testing capabilities, this project includes a Health Check Monitoring system. This feature allows you to monitor the health and uptime of any number of user-defined HTTP endpoints.

The Health Check system is also designed with a microservices architecture, consisting of two main components that are pulled as Docker images:

*   **`orchestrator-api` (`luisffilho/health-check-api`):** This service provides the API for managing the endpoints to be monitored. The frontend communicates with this service to add, remove, and view monitored URLs and their health status logs.
*   **`worker-api` (`luisffilho/health-check-worker`):** This is a dedicated worker service that periodically performs the health checks on the user-defined URLs. Separating this functionality ensures that the main application is not impacted by the monitoring tasks.

This monitoring feature is accessible through the same frontend application, providing a unified interface for both load testing and health checking. 

---
### DNS & SSL Health Checker
The DNS & Certificate Analysis API is a service for analyzing DNS records and security certificates of a given domain.

#### Functionalities
- Analyzes the DNS records of a domain.
- Analyzes the security certificate of a domain.
- Stores the history of analyses in a MongoDB database.
- Provides an endpoint to consult the history of analyses.

#### Project Architecture
The project architecture follows a layered approach, separating responsibilities to facilitate maintenance and scalability.
- `cmd/api/main.go`: This is the entry point of the application. It is responsible for initializing dependencies (such as the database connection and services), configuring the HTTP request router, and starting the server.
- `pkg/`: Contains all the business logic of the application, divided into sub-packages:
    - `router`: Defines the API routes and associates them with their respective `handlers`.
    - `handler`: Layer responsible for receiving HTTP requests, validating input data, calling the appropriate services, and returning responses.
    - `analysis`: Contains the main business logic for DNS and certificate analysis.
    - `database`: Abstracts the communication with the MongoDB database, providing methods to create, read, update, and delete records.
- `configs/`: Stores the application's configuration files, such as `config.yaml`.

The flow of a request is as follows:
1. The request arrives at a route defined in the `router` package.
2. The `router` directs the request to the corresponding `handler`.
3. The `handler` processes the request, interacting with the `analysis` service to execute the business logic.
4. The `analysis` service uses the `database` package to persist or query data.
5. The `handler` formulates the response and sends it back to the client.

#### API Endpoints
- `POST /api/v1/analyze`: Starts a new analysis for a domain.
- `GET /api/v1/history/{target}`: Returns the analysis history for a domain.
- `GET /health`: Checks the API status.

## 📦 Technologies Used

-   **Frontend (`load-tester-app`)**
    -   React + Vite
    -   TypeScript
    -   TailwindCSS
    -   ShadCN UI
    -   Chart.js for charts

-   **Backend (`load-tester-api` & `load-tester-worker`)**
    -   Node.js
    -   TypeScript
    -   Express (for the API)

-   **DNS & Certificate Analysis API (`dns-cert-api`)**
    -   Go
    -   MongoDB

-   **DevOps**
    -   Docker & Docker Swarm
    -   Kubernetes (k8s)

---

## 🚀 🐳 Running the Project with Docker Swarm

### Prerequisites

-   [Docker](https://www.docker.com/) must be installed. The script will automatically initialize Docker Swarm if it's not already configured.

---

You can bring up the entire stack (frontend + backend + worker) using our automated installation script. This script will create a `stack.yaml` file with all the service configurations and deploy it to Docker Swarm.

Run the automated script directly from GitHub:

```bash
curl -sSL https://raw.githubusercontent.com/luisfelix-93/load-tester/prod/loadtester-install.sh | bash
```

After execution, the script will deploy the entire application stack using Docker Swarm. You can check the status of the services with the command:

```bash
docker stack ps loadtester
```

Access the application at: [http://localhost:5173](http://localhost:5173)

### Customization

The installation script creates a `stack.yaml` file. You can modify this file to customize the deployment, such as changing image versions or resource limits, and then redeploy the stack with:

```bash
docker stack deploy -c stack.yaml loadtester
```

## ☸️ Running with Kubernetes (using Kind)

You can easily run the entire application stack on a local Kubernetes cluster using [Kind](https://kind.sigs.k8s.io/).

### Prerequisites

-   [kubectl](https://kubernetes.io/docs/tasks/tools/) installed.
-   [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) installed.

### Installation

Run the following command to download and execute the installation script. It will set up a complete environment automatically:

```sh
curl -sL https://raw.githubusercontent.com/luisfelix-93/load-tester/prod/kubernetes-install.sh | bash
```

### What the script does:

1.  **Checks for `kubectl` and `kind`**: Ensures the required tools are available.
2.  **Creates a Kind Cluster**: If a cluster named `load-tester` doesn't already exist, it creates one.
3.  **Deploys the Application**: Applies all the necessary Kubernetes manifests from the repository to deploy the services, deployments, and HPA.
4.  **Waits for Readiness**: The script waits until the main application deployments are ready and running.
5.  **Enables Access**: It automatically sets up `kubectl port-forward` for all necessary services in the background, so you can access them from your local machine.

After the script finishes, the application will be running and accessible.

### Accessing the Application

-   **Frontend**: [http://localhost:5173](http://localhost:5173)
-   **Load Tester API**: [http://localhost:4000](http://localhost:4000)
-   **Health Check API**: [http://localhost:5000](http://localhost:5000)

You can check the status of the pods and services with standard `kubectl` commands:

```sh
kubectl get pods
kubectl get services
```

---

## 🛠️ Future Improvements

-   Export results in CSV format
-   Support for authentication (JWT, Basic Auth)
-   Advanced filters in reports

---

## 📄 License

This project is licensed under the MIT License.
Feel free to use, modify, and contribute!

---

# ⚡ Developed by

Luis Felipe Felix Filho
[LinkedIn](https://www.linkedin.com/in/luis-felix-filho/) • [GitHub](https://github.com/luisfelix-93)
