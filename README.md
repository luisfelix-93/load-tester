# 💫 Load Tester - A Distributed Load Testing Tool

This project is a distributed load testing application built with a microservices architecture. The system is composed of a **React** frontend, a **Node.js/TypeScript** API, and a separate **Node.js/TypeScript** worker to run the load tests.

The tool allows you to send a configurable number of HTTP requests to a target URL and view performance statistics and charts.

---

## ✨ Architecture
### Load-Tester
The Load Tester is designed as a distributed system to separate concerns and improve scalability. The main components are:

*   **`load-tester-app` (Frontend):** A web interface built with React, Vite, TypeScript, and TailwindCSS for users to configure and visualize load tests.
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

## ☸️ Running with Kubernetes

You can also run the application on a Kubernetes cluster using the manifests provided in the `k8s-manifests` folder.

### Prerequisites

-   [kubectl](https://kubernetes.io/docs/tasks/tools/) configured.
-   A Kubernetes cluster (local or cloud).

### Steps

1.  Navigate to the manifests directory:
    ```bash
    cd k8s-manifests
    ```

2.  Apply all the manifests:
    ```bash
    kubectl apply -f .
    ```
    This will create the deployments and services for the backend (API) and frontend.

3.  Expose the frontend for external access (example using port-forward):
    ```bash
    kubectl port-forward svc/loadtest-app-svc 5173:5173
    ```
    Now access the application at [http://localhost:5173](http://localhost:5173).

> **Note:** If you want to expose the service via a LoadBalancer or Ingress, adjust the Service type according to your infrastructure.

### Manifests Structure

-   `api-deployment.yaml` — Deployment for the backend (API)
-   `api-service.yaml` — Service for the backend (API)
-   `frontend-deployment.yaml` — Deployment for the frontend (App)
-   `frontend-service.yaml` — Service for the frontend (App)

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