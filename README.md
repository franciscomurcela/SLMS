# SLMS - Shipping and Logistics Management System

Software Engineering project for group 204.

## Team Members

| Function          | Name                | Student Number   |
|-------------------|---------------------|------------------|
| Scrum Master      | Gonçalo Lima        | 108254           |
| Product Owner     | Xavier Machado      | 108019           |
| QA Engineer       | João Rodrigues      | 103947           |
| Service Analyst   | André Miragaia      | 108412           |
| DevOps Engineer   | Francisco Murcela   | 108815           |

## Project Overview

SLMS is a microservices-based shipping and logistics management system designed to handle order processing, carrier management, user authentication, and real-time tracking of shipments.

## Architecture

The system follows a microservices architecture with the following components:

- **Backend Services** (Spring Boot + Java 21)
  - Order Service (Port 8081)
  - User Service (Port 8082)
  - Carrier Service (Port 8080)
  
- **Frontend** (React + TypeScript + Vite)
  - Web Application (Port 5173)
  
- **Authentication**
  - Keycloak (Port 8083)
  
- **Databases**
  - PostgreSQL instances for each service
  - Supabase for centralized data storage

## Prerequisites

Before running the project, ensure you have the following installed:

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

For Windows users, PowerShell 5.1 or higher is required.
For Linux/macOS users, Bash is required.

## Quick Start

### Reinicialização Completa do Sistema

Para reiniciar todo o sistema (backend + frontend + base de dados):

```bash
cd /home/xavier/MECT/group-project-es2526_204
./restart.sh
```

Este script:
1. Para todos os serviços (frontend e backend)
2. Reconstrói e inicia o backend
3. Aguarda 15 segundos para estabilização
4. Importa schema e dados da base de dados
5. Reconstrói e inicia o frontend
6. Apresenta estado final dos containers

### Início Manual

### 1. Initial Setup (First Time Only)

Before starting the services for the first time, you need to configure environment variables and Keycloak settings.

#### Step 1.1: Create Environment Files

The project uses environment variables that are not committed to the repository for security reasons. Create them by running:

**Windows (PowerShell):**
```powershell
.\scripts\create-env.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x ./scripts/create-env.sh
./scripts/create-env.sh
```

This script will create the necessary `.env` files with database credentials and other configuration.

#### Step 1.2: Configure Keycloak

After the backend services are running for the first time, you need to import the Keycloak realm configuration:

**Windows (PowerShell):**
```powershell
cd slms-backend
.\scripts\reimport-keycloak.ps1
```

**Linux/macOS (Bash):**
```bash
cd slms-backend
chmod +x ./scripts/reimport-keycloak.sh
./scripts/reimport-keycloak.sh
```

This script will:
- Import the ESg204 realm configuration
- Configure all test users with their roles
- Set up authentication clients for the frontend


### 2. Start Backend Services

The project includes automated scripts to start all backend services with a single command.

**Windows (PowerShell):**
```powershell
.\scripts\start-project.ps1
```

**Linux/macOS (Bash):**
```bash
./scripts/start-project.sh
```

This script will:
- Create necessary environment files
- Start all Docker containers (databases, backend services, Keycloak)
- Wait for services to become healthy
- Display service status and access URLs

**Note:** First-time startup may take 5-10 minutes as Docker images need to be downloaded and built.

### 3. Start Frontend Application

After the backend services are running, start the frontend:

**Windows (PowerShell):**
```powershell
.\scripts\start-frontend.ps1
```

**Linux/macOS (Bash):**
```bash
./scripts/start-frontend.sh
```

This script will:
- Navigate to the frontend directory
- Install npm dependencies (if needed)
- Start the development server

The frontend will be available at: `http://localhost:5173`

## Project Structure

```
group-project-es2526_204/
├── slms-backend/
│   ├── order_service/          # Order management microservice
│   ├── user_service/            # User management microservice
│   ├── carrier_service/         # Carrier management microservice
│   ├── authentication_service/  # Keycloak configuration
│   ├── config/                  # Shared configuration files
│   ├── keycloak-init/           # Keycloak realm export
│   └── docker-compose.yml       # Backend services orchestration
├── react-frontend/
│   └── frontend/                # React application
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── config/          # Frontend configuration
│       │   └── context/         # React context providers
│       ├── package.json
│       └── vite.config.ts
└── scripts/
    ├── start-project.ps1        # Windows backend startup script
    ├── start-project.sh         # Linux/macOS backend startup script
    ├── start-frontend.ps1       # Windows frontend startup script
    └── start-frontend.sh        # Linux/macOS frontend startup script
```

## Available Services

Once all services are running, you can access them at the following URLs:

| Service          | URL                        | Description                          |
|------------------|----------------------------|--------------------------------------|
| Frontend         | http://localhost:5173      | Main web application                 |
| Order Service    | http://localhost:8081      | Order management API                 |
| User Service     | http://localhost:8082      | User management API                  |
| Carrier Service  | http://localhost:8080      | Carrier management API               |
| Keycloak         | http://localhost:8083      | Authentication and authorization     |

### Default Keycloak Credentials

#### Admin Console
- **URL:** http://localhost:8083/admin
- **Username:** `admin`
- **Password:** `admin`

#### Test User Accounts

The system includes pre-configured test accounts for each role. All passwords are the same as the username for testing purposes.

| Role              | Username          | Password          | Access Level                                    |
|-------------------|-------------------|-------------------|-------------------------------------------------|
| **Driver**        | `marionunes`      | `marionunes`      | Driver manifest                                 |
|                   | `lucaspereira`    | `lucaspereira`    | Driver manifest                                 |
|                   | `marianasilva`    | `marianasilva`    | Driver manifest                                 |
| **Customer**      | `mikedias`        | `mikedias`        | Order tracking                                  |
|                   | `anacosta`        | `anacosta`        | Order tracking                                  |
|                   | `felipegomes`     | `felipegomes`     | Order tracking                                  |
|                   | `viniciuslima`    | `viniciuslima`    | Order tracking                                  |
| **Manager**       | `fabiofigueiredo` | `fabiofigueiredo` | Analytics                                       |
| **Warehouse**     | `ricardocastro`   | `ricardocastro`   | Order preparation                               |
| **Csr**           | `camilasantos`    | `camilasantos`    | Order tracking                                  |

### Authentication and Authorization

The application uses Keycloak for authentication and role-based access control (RBAC). Each user role has access to specific routes and features:

#### Route Protection by Role

- **Driver Routes** (`/driver`)
  - Accessible only to users with the `Driver` role

- **Customer Routes** (`/customer`)
  - Accessible only to users with the `Costumer` role

- **Manager Routes** (`/logisticsmanager`)
  - Accessible only to users with the `Manager` role

- **Warehouse Routes** (`/warehouse`)
  - Accessible only to users with the `Warehouse` role

- **Carrier Routes** (`/customerservicerep`)
  - Accessible only to users with the `Csr` (Costumer service representative) role


#### How Role Protection Works

1. **User logs in** through Keycloak at `http://localhost:8083`
2. **Keycloak issues a JWT token** containing user information and assigned roles
3. **Frontend validates the token** and checks user roles
4. **React Router redirects** users to their role-specific dashboard
5. **Backend APIs verify** the JWT token and role claims before processing requests
6. **Unauthorized access attempts** are automatically redirected to the login page



### Login Process

1. Access the frontend at `http://localhost:5173` ou `http://localhost:3000` (Docker)
2. Click on the login button or navigate to a protected route
3. You will be redirected to Keycloak login page
4. Enter credentials from the test accounts table above
5. Upon successful authentication, you will be redirected to your role-specific dashboard

## Funcionalidades Principais

### Chatbot de Rastreamento
O sistema inclui um assistente virtual integrado na página do cliente que permite consultar informações sobre encomendas através de conversação natural.

**Características:**
- Deteção automática de Tracking ID (UUID)
- Suporte para Order ID e Tracking ID
- Informações em tempo real sobre estado das encomendas
- Respostas contextualizadas

**Documentação completa:** Ver [CHATBOT.md](CHATBOT.md)

**Exemplo de uso:**
```
Utilizador: d0d1fdf3-5e2f-420f-87ac-0396833b0aca
Bot: 🟡 Informações da Encomenda
     Tracking ID: d0d1fdf3-5e2f-420f-87ac-0396833b0aca
     Status: Pending
     Origem: Rua das Flores, 120
     Destino: Rua das Acácias, 145
     Transportadora: DHL Express
     ...
```

### Service Health Checks

To verify all services are running correctly:

```bash
cd slms-backend
docker-compose ps
```

All services should show status as "Up" and "healthy".

## Additional Resources

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Docker Documentation](https://docs.docker.com/)
