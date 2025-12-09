# 🚀 SLMS - Complete Setup Guide for Clean Ubuntu Server 24.04.3 LTS

This guide provides **complete step-by-step instructions** to install and run the SLMS (Shipping & Logistics Management System) project on a **clean Ubuntu Server 24.04.3 LTS** with no pre-installed dependencies.

---

## 📋 Table of Contents

1. [System Requirements](#-system-requirements)
2. [Step 1: Update System](#-step-1-update-system)
3. [Step 2: Install Git](#-step-2-install-git)
4. [Step 3: Clone the Repository](#-step-3-clone-the-repository)
5. [Step 4: Install Docker](#-step-4-install-docker)
6. [Step 5: Install Docker Compose](#-step-5-install-docker-compose)
7. [Step 6: Install Node.js and npm](#-step-6-install-nodejs-and-npm)
8. [Step 7: Configure Environment Variables](#-step-7-configure-environment-variables)
9. [Step 8: Start Backend Services](#-step-8-start-backend-services)
10. [Step 9: Initialize Database](#-step-9-initialize-database)
11. [Step 10: Start Frontend](#-step-10-start-frontend)
12. [Step 11: Access the Application](#-step-11-access-the-application)
13. [Test Users](#-test-users)
14. [Troubleshooting](#-troubleshooting)
15. [Stop Services](#-stop-services)
16. [Architecture Overview](#-architecture-overview)

---

## 💻 System Requirements

- **OS**: Ubuntu Server 24.04.3 LTS (clean installation)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: Minimum 20GB free space
- **Network**: Internet connection for downloading packages
- **User**: Sudo privileges required

---

## 🔄 Step 1: Update System

First, update the package list and upgrade existing packages:

```bash
sudo apt update
sudo apt upgrade -y
```

Install basic utilities:

```bash
sudo apt install -y curl wget ca-certificates gnupg lsb-release software-properties-common
```

---

## 📦 Step 2: Install Git

Install Git to clone the repository:

```bash
sudo apt install -y git
```

Verify installation:

```bash
git --version
# Expected output: git version 2.43.0 or higher
```

---

## 📥 Step 3: Clone the Repository

Clone the SLMS project repository:

```bash
cd ~
git clone https://github.com/detiuaveiro/group-project-es2526_204.git
cd group-project-es2526_204
```

Checkout the correct branch:

```bash
git checkout master
```

---

## 🐳 Step 4: Install Docker

### 4.1: Remove Old Docker Versions (if any)

```bash
sudo apt remove -y docker docker-engine docker.io containerd runc
```

### 4.2: Add Docker's Official GPG Key

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 4.3: Add Docker Repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 4.4: Install Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 4.5: Start and Enable Docker

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 4.6: Add Current User to Docker Group

```bash
sudo usermod -aG docker $USER
```

**IMPORTANT**: Log out and log back in for group changes to take effect, or run:

```bash
newgrp docker
```

### 4.7: Verify Docker Installation

```bash
docker --version
# Expected output: Docker version 24.0.0 or higher

docker run hello-world
# Should download and run a test container successfully
```

---

## 🔧 Step 5: Install Docker Compose

Docker Compose v2 is installed as a plugin with Docker Engine. Verify:

```bash
docker compose version
# Expected output: Docker Compose version v2.21.0 or higher
```

---

## 📦 Step 6: Install Node.js and npm

### 6.1: Install Node.js 20.x via NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 6.2: Verify Installation

```bash
node --version
# Expected output: v20.x.x

npm --version
# Expected output: 10.x.x or higher
```

---

## ⚙️ Step 7: Configure Environment Variables

### 7.1: Create Backend Environment File

Navigate to the project root and run the environment setup script:

```bash
cd ~/group-project-es2526_204
chmod +x ./scripts/create-env.sh
./scripts/create-env.sh
```

This creates `/slms-backend/.env` with necessary database credentials.

### 7.2: Configure Frontend Environment (Optional)

The frontend environment variables are optional for basic functionality. To configure Google Maps and Flagsmith:

```bash
cd react-frontend/frontend
cp .env.example .env
```

Edit `.env` file (optional):

```bash
nano .env
```

Add your API keys if you have them:

```env
# Google Maps API Key (optional - for delivery routes feature)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Flagsmith Feature Flags (optional)
VITE_FLAGSMITH_ENVIRONMENT_KEY=your_flagsmith_key_here
```

Press `Ctrl+O` to save, `Enter` to confirm, `Ctrl+X` to exit.

**Note**: The application works without these keys, but some features (Google Maps routes) will be disabled.

---

## 🚀 Step 8: Start Backend Services

### 8.1: Navigate to Backend Directory

```bash
cd ~/group-project-es2526_204/slms-backend
```

### 8.2: Create Observability Network

The backend requires an observability network for monitoring:

```bash
docker network create rede-obs
```

### 8.3: Start Backend Services with Docker Compose

```bash
docker compose up -d --build
```

This will:

- Download necessary Docker images (PostgreSQL, Keycloak, Spring Boot services)
- Build the microservices (User, Order, Carrier)
- Start all containers in detached mode

**Expected output**:

```
[+] Running 7/7
 ✔ Network slms-backend_slms-network  Created
 ✔ Container keycloak-db              Started
 ✔ Container slms-db                  Started
 ✔ Container keycloak                 Started
 ✔ Container user-service             Started
 ✔ Container carrier-service          Started
 ✔ Container order-service            Started
```

### 8.4: Wait for Services to Initialize

Wait approximately 30-60 seconds for all services to become healthy:

```bash
echo "⏳ Waiting for services to initialize..."
sleep 45
```

### 8.5: Check Service Status

```bash
docker compose ps
```

All services should show status as `Up` or `Up (healthy)`.

---

## 💾 Step 9: Initialize Database

### 9.1: Import Database Schema

```bash
cd ~/group-project-es2526_204
docker exec -i slms-db psql -U slms_user -d slms_db < slms-backend/config/schema-postgresql.sql
```

**Expected output**: Various CREATE TABLE statements.

### 9.2: Import Test Data

```bash
docker exec -i slms-db psql -U slms_user -d slms_db < scripts/slms-data-only-20251027-193147.sql/slms-data-only-20251027-193147.sql
```

**Expected output**: Multiple INSERT statements with success messages.

### 9.3: Verify Database Initialization

```bash
docker exec -it slms-db psql -U slms_user -d slms_db -c "SELECT COUNT(*) FROM \"Users\";"
```

**Expected output**: Should show a count greater than 0 (e.g., 10-15 users).

---

## 🎨 Step 10: Start Frontend

### 10.1: Navigate to Frontend Docker Directory

```bash
cd ~/group-project-es2526_204/react-frontend
```

### 10.2: Start Frontend Container

```bash
docker compose up -d --build
```

This will:

- Build the React application with Vite
- Create an optimized production build
- Serve it via Nginx on port 80

**Expected output**:

```
[+] Running 1/1
 ✔ Container slms-frontend  Started
```

### 10.3: Wait for Frontend to Build

The first build may take 2-5 minutes:

```bash
echo "⏳ Waiting for frontend to build and start..."
sleep 60
```

### 10.4: Monitor Frontend Logs (Optional)

```bash
docker logs -f slms-frontend
```

Press `Ctrl+C` to exit log view.

---

## 🌐 Step 11: Access the Application

### 11.1: Get Server IP Address

```bash
hostname -I | awk '{print $1}'
```

Note this IP address (e.g., `192.168.1.100`).

### 11.2: Access URLs

Open a web browser and navigate to:

| Service             | URL                                       | Description                 |
| ------------------- | ----------------------------------------- | --------------------------- |
| **Frontend**        | `http://<SERVER_IP>`                      | Main application interface  |
| **Keycloak Admin**  | `http://<SERVER_IP>:8083/auth/admin`      | Authentication management   |
| **User Service**    | `http://<SERVER_IP>:8082/user/health`     | User microservice health    |
| **Order Service**   | `http://<SERVER_IP>:8081/actuator/health` | Order microservice health   |
| **Carrier Service** | `http://<SERVER_IP>:8080/actuator/health` | Carrier microservice health |

### 11.3: Keycloak Admin Access

- **URL**: `http://<SERVER_IP>:8083/auth/admin`
- **Username**: `admin`
- **Password**: `admin`

---

## 👥 Test Users

The system comes pre-configured with test accounts. All passwords match the username.

### Customer Accounts (Order Tracking)

| Username       | Password       | Role     |
| -------------- | -------------- | -------- |
| `anacosta`     | `anacosta`     | Customer |
| `mikedias`     | `mikedias`     | Customer |
| `felipegomes`  | `felipegomes`  | Customer |
| `viniciuslima` | `viniciuslima` | Customer |

### Driver Accounts (Delivery Management)

| Username       | Password       | Role   |
| -------------- | -------------- | ------ |
| `marionunes`   | `marionunes`   | Driver |
| `lucaspereira` | `lucaspereira` | Driver |
| `marianasilva` | `marianasilva` | Driver |

### Warehouse Staff

| Username        | Password        | Role      |
| --------------- | --------------- | --------- |
| `ricardocastro` | `ricardocastro` | Warehouse |

### Customer Service Representative

| Username       | Password       | Role |
| -------------- | -------------- | ---- |
| `camilasantos` | `camilasantos` | CSR  |

### Logistics Manager

| Username          | Password          | Role    |
| ----------------- | ----------------- | ------- |
| `fabiofigueiredo` | `fabiofigueiredo` | Manager |

### Test Tracking IDs

For testing the order tracking functionality:

- **Order ID**: `3d88f621-9667-4da9-8920-f85f21907195`
- **Tracking ID**: `d0d1fdf3-5e2f-420f-87ac-0396833b0aca`

---

## 🐛 Troubleshooting

### Issue: Docker Permission Denied

**Symptom**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Or log out and log back in.

### Issue: Port Already in Use

**Symptom**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution**: Check what's using the port and stop it:

```bash
sudo lsof -i :80
sudo systemctl stop apache2  # If Apache is running
```

Or change the port in `react-frontend/docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Access via http://<SERVER_IP>:8080
```

### Issue: Services Not Healthy

**Symptom**: Services stuck in "starting" state

**Solution**: Check logs for specific service:

```bash
docker logs keycloak
docker logs slms-db
docker logs user-service
docker logs carrier-service
docker logs order-service
```

Wait longer (up to 2 minutes) for services to fully initialize.

### Issue: Database Connection Errors

**Symptom**: Services can't connect to database

**Solution**: Verify database is running and healthy:

```bash
docker exec slms-db pg_isready -U slms_user -d slms_db
```

Restart services:

```bash
cd ~/group-project-es2526_204/slms-backend
docker compose restart
```

### Issue: Frontend Not Loading

**Symptom**: Blank page or connection refused

**Solution**:

```bash
cd ~/group-project-es2526_204/react-frontend
docker logs slms-frontend

# Rebuild if necessary
docker compose down
docker compose up -d --build
```

### Issue: Keycloak Redirect Issues

**Symptom**: Login redirects to localhost instead of server IP

**Solution**: This is expected behavior for the development setup. Make sure you're accessing via the server's IP address, not localhost.

### Issue: Out of Memory During Build

**Symptom**: Frontend build fails with JavaScript heap out of memory

**Solution**: The Dockerfile already includes memory optimization. If issues persist, ensure your server has at least 4GB RAM available.

### Check Overall System Status

```bash
# Check all backend services
cd ~/group-project-es2526_204/slms-backend
docker compose ps

# Check frontend
cd ~/group-project-es2526_204/react-frontend
docker compose ps

# Check disk space
df -h

# Check memory
free -h
```

---

## 🛑 Stop Services

### Stop All Services

```bash
# Stop frontend
cd ~/group-project-es2526_204/react-frontend
docker compose down

# Stop backend
cd ~/group-project-es2526_204/slms-backend
docker compose down
```

### Stop and Remove All Data (Complete Reset)

```bash
# Stop and remove volumes
cd ~/group-project-es2526_204/react-frontend
docker compose down -v

cd ~/group-project-es2526_204/slms-backend
docker compose down -v

# Remove network
docker network rm rede-obs
```

### Restart Services

To restart the entire system, use the provided restart script:

```bash
cd ~/group-project-es2526_204
chmod +x ./restart.sh
./restart.sh
```

This script automatically:

1. Stops all services
2. Rebuilds backend
3. Waits for initialization
4. Imports database schema and data
5. Rebuilds and starts frontend
6. Shows final container status

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SLMS System Architecture                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                     │
│              Nginx Container - Port 80                       │
│  - Customer Portal      - Driver Dashboard                   │
│  - Warehouse Management - Logistics Analytics                │
│  - ChatBot Assistant    - Order Tracking                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│ User Service │ │   Order    │ │  Carrier   │ │  Keycloak  │
│   (8082)     │ │  Service   │ │  Service   │ │   (8083)   │
│              │ │   (8081)   │ │   (8080)   │ │            │
│ Spring Boot  │ │ Spring Boot│ │ Spring Boot│ │  Auth/IAM  │
└───────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
        │               │               │               │
        └───────────────┼───────────────┴───────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL   │
                │   Databases    │
                │                │
                │ - slms-db      │
                │   (Port 5434)  │
                │ - keycloak-db  │
                │   (Port 5433)  │
                └────────────────┘
```

### Technology Stack

**Frontend:**

- React 18.2
- TypeScript
- Vite (Build tool)
- Bootstrap 5
- Keycloak.js (Authentication)
- Nginx (Web server)

**Backend:**

- Java 17
- Spring Boot 3.x
- Spring Security
- JPA/Hibernate
- Maven

**Infrastructure:**

- Docker & Docker Compose
- PostgreSQL 15
- Keycloak 23.0
- Nginx (Reverse proxy)

**Monitoring (Optional):**

- OpenTelemetry
- Grafana
- Prometheus
- Loki
- Tempo

---

## 📚 Additional Resources

- **Main README**: `README.md` - Detailed project information
- **Running Guide**: `RUNNING_GUIDE.md` - Development and cloud deployment
- **Architecture Docs**: `docs/` directory
- **API Documentation**: Available at service health endpoints
- **Keycloak Docs**: https://www.keycloak.org/documentation

---

## 🔐 Security Notes

**For Production Deployments:**

1. **Change Default Passwords**: Update all default passwords in:

   - Keycloak admin console
   - Database credentials
   - Test user accounts

2. **Enable HTTPS**: Configure SSL/TLS certificates

3. **Configure Firewall**: Use `ufw` to restrict access:

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Environment Variables**: Never commit `.env` files with real credentials

5. **Database Backups**: Set up regular backup procedures

---

## 📞 Support

For issues or questions:

- **GitHub Issues**: https://github.com/detiuaveiro/group-project-es2526_204/issues
- **Documentation**: Check `README.md` and `RUNNING_GUIDE.md`
- **Logs**: Always check Docker logs first: `docker logs <container-name>`

---

## ✅ Quick Start Checklist

- [ ] System updated (`apt update && apt upgrade`)
- [ ] Git installed and repository cloned
- [ ] Docker installed and user added to docker group
- [ ] Docker Compose verified
- [ ] Node.js 20.x and npm installed
- [ ] Environment variables configured
- [ ] Observability network created (`docker network create rede-obs`)
- [ ] Backend services started (`docker compose up -d --build`)
- [ ] Database schema imported
- [ ] Test data imported
- [ ] Frontend started
- [ ] Application accessible via browser
- [ ] Test login successful

---

**Created**: December 2025  
**Version**: 1.0  
**For**: Ubuntu Server 24.04.3 LTS (Clean Installation)  
**Project**: SLMS - Shipping & Logistics Management System  
**Group**: ES2526_204
