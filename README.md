# SLMS - Shipping and Logistics Management System

Sistema de gestão de encomendas e logística baseado em microserviços, desenvolvido com Spring Boot, React TypeScript e Keycloak.

**Arquitetura:** Backend (Java 17 + Spring Boot) + Frontend (React + TypeScript) + PostgreSQL + Keycloak OAuth2

---

## 📋 Requisitos do Sistema

- **OS**: Ubuntu Server 24.04.3 LTS (clean installation)
- **RAM**: Mínimo 4GB (recomendado 8GB)
- **Disco**: Mínimo 20GB livres
- **CPU**: Intel i7 ou equivalente
- **Rede**: Ligação à internet para download de pacotes
- **Utilizador**: Com privilégios sudo

---

## 🚀 Instalação em Ubuntu Server 24.04.3 LTS (Clean)

Esta secção assume um **servidor completamente zerado** sem Docker, Git, Node.js ou qualquer ferramenta de desenvolvimento instalada.

### Opção 1: Instalação Automática Completa (Recomendado)

**Passo 1:** Instalar Git (necessário para clonar o repositório)

```bash
sudo apt update
sudo apt install -y git
```

**Passo 2:** Clonar o repositório

```bash
cd ~
git clone https://github.com/detiuaveiro/group-project-es2526_204.git
cd group-project-es2526_204
```

**Passo 3:** Executar o script de instalação completa

```bash
chmod +x setup-from-scratch.sh
./setup-from-scratch.sh
```

Este script irá:
- ✅ Atualizar o sistema
- ✅ Instalar Docker, Docker Compose e Node.js 20.x
- ✅ Executar `quick-start.sh` automaticamente para iniciar todos os serviços
- ⏱️ **Tempo estimado: 5-10 minutos**

**Após a instalação**, faça logout e login novamente para que o grupo `docker` seja aplicado.

---

### Opção 2: Instalação Manual Passo-a-Passo

Se preferir instalar cada componente manualmente:

### Passo 1: Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget ca-certificates gnupg lsb-release software-properties-common apt-transport-https
```

---

### Passo 2: Instalar Git

```bash
sudo apt install -y git
git --version  # Verificar instalação
```

---

### Passo 3: Instalar Docker e Docker Compose

```bash
# Remover versões antigas (se existirem)
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositório do Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine e Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adicionar utilizador ao grupo docker
sudo usermod -aG docker $USER

# Ativar e iniciar Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verificar instalação
docker --version
docker compose version
```

**⚠️ IMPORTANTE:** Após adicionar o utilizador ao grupo docker, faça logout e login novamente, ou execute:
```bash
newgrp docker
```

---

### Passo 4: Instalar Node.js 20.x e npm

```bash
# Adicionar repositório NodeSource para Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js e npm
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve ser v20.x.x
npm --version   # Deve ser 10.x.x ou superior
```

---

### Passo 5: Clonar o Repositório

```bash
cd ~
git clone https://github.com/detiuaveiro/group-project-es2526_204.git
cd group-project-es2526_204
```

---

### Passo 6: Executar Instalação Automática

```bash
# Dar permissões aos scripts
chmod +x quick-start.sh quick-stop.sh restart.sh

# Executar setup automático
./quick-start.sh
```

**⏱️ Aguarde 5-10 minutos.** O script `quick-start.sh` irá automaticamente:

1. ✅ **Validar pré-requisitos** - Verifica se Docker, Docker Compose e Node.js 18+ estão instalados
2. ✅ **Criar ficheiros de ambiente** - Gera `.env` com credenciais da BD e API keys (Gemini, Flagsmith, Google Maps) hardcoded para ambiente académico
3. ✅ **Criar rede Docker de observabilidade** - Cria rede `rede-obs` para OpenTelemetry (a rede `slms-network` é criada automaticamente pelo backend)
4. ✅ **Iniciar backend** - Levanta PostgreSQL, Keycloak e 3 microserviços Spring Boot
5. ✅ **Importar base de dados** - Importa schema e dados de teste automaticamente
6. ✅ **Iniciar frontend** - Instala dependências npm e levanta aplicação React

---

### Aceder ao Sistema

Após o `quick-start.sh` concluir com sucesso:

- **Frontend (Aplicação Principal)**: `http://<ip-do-servidor>:3000`
- **Keycloak Admin Console**: `http://<ip-do-servidor>:8083/auth/admin` (admin/admin)

**Para obter o IP do servidor:**
```bash
hostname -I | awk '{print $1}'
```

---

## 👥 Credenciais de Teste

Todos os utilizadores têm **password igual ao username**:

| Username              | Password              | Role                          | 
| --------------------- | --------------------- | ----------------------------- |
| `anacosta`            | `anacosta`            | Cliente (Customer)            |
| `mikedias`            | `mikedias`            | Cliente (Customer)            | 
| `felipegomes`         | `felipegomes`         | Cliente (Customer)            |
| `viniciuslima`        | `viniciuslima`        | Cliente (Customer)            |
| `marionunes`          | `marionunes`          | Motorista (Driver)            | 
| `lucaspereira`        | `lucaspereira`        | Motorista (Driver)            | 
| `marianasilva`        | `marianasilva`        | Motorista (Driver)            | 
| `ricardocastro`       | `ricardocastro`       | Armazém (Warehouse)           | 
| `fabiofigueiredo`     | `fabiofigueiredo`     | Gestor Logística (Manager)    | 
| `camilasantos`        | `camilasantos`        | Customer Service (CSR)        | 

**🔍 Tracking IDs de teste público:**

- `d0d1fdf3-5e2f-420f-87ac-0396833b0aca`
- `9315a70a-ae2e-4a64-8d67-07508155500d`
- `039e0cfa-a791-416f-bfc9-dece9c6c5068`
- `71e7f15d-32c8-4643-ae82-07c7922c2f15`
- `ae939af6-a572-4f88-9b51-3e253e288371`
- `c6d018e9-d265-4679-bc40-d42e5f6ed46b`

---

## 🛠️ Gestão de Serviços

### Parar Todos os Serviços

```bash
./quick-stop.sh
```

### Reiniciar com Reimport da Base de Dados

```bash
./restart.sh
```
## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SLMS System Architecture                  │
└─────────────────────────────────────────────────────────────┘

Cliente (Browser)
    ↓
Frontend Container (React + Nginx) - Port 3000
    ├── Rede: slms-network (comunicação com backend)
    └── Rede: rede-obs (observabilidade/telemetria)
    ↓
Backend Microservices (na rede slms-network):
  ├── User Service (Port 8082)      - Gestão de utilizadores + AI Chatbot
  ├── Order Service (Port 8081)     - Gestão de encomendas + Shipments
  └── Carrier Service (Port 8080)   - Gestão de transportadoras
    ↓
PostgreSQL Database (Port 5434)     - Dados principais (slms_db)
Keycloak (Port 8083)                - Autenticação OAuth2/JWT
PostgreSQL Keycloak (Port 5433)     - Dados do Keycloak

Redes Docker:
  • slms-network: Comunicação entre backend services (bridge)
  • rede-obs: Observabilidade e telemetria OpenTelemetry
```

### Portas Utilizadas

| Serviço            | Porta Externa | Porta Interna |
|--------------------|---------------|---------------|
| Frontend (Nginx)   | 3000          | 80            |
| User Service       | 8082          | 8082          |
| Order Service      | 8081          | 8081          |
| Carrier Service    | 8080          | 8080          |
| Keycloak           | 8083          | 8080          |
| PostgreSQL SLMS    | 5434          | 5432          |
| PostgreSQL Keycloak| 5433          | 5432          |

---

## 🔐 Notas de Segurança

**⚠️ Este projeto utiliza credenciais de desenvolvimento/teste hardcoded para facilitar a avaliação académica.**

**Para ambiente de produção:**

1. Alterar todas as passwords (PostgreSQL, Keycloak, utilizadores)
2. Configurar HTTPS/SSL com certificados válidos
3. Usar secrets management (HashiCorp Vault, AWS Secrets Manager)
4. Configurar firewall (`ufw`) para limitar acessos
5. Implementar backups automáticos da base de dados
6. Rodar API keys do Gemini, Google Maps e Flagsmith
7. Configurar rate limiting nos endpoints
8. Ativar logging e monitoring (Prometheus + Grafana)

---

## 📚 Documentação Técnica

Para **explicação detalhada da arquitetura, funcionalidades, decisões técnicas e testes**, consulte:

👉 **[docs/relatorio-final.pdf](docs/relatorio-final.pdf)** - Relatório completo do projeto

---

## 🎓 Informação Académica

**Projeto de Engenharia de Software 2025/2026 - Grupo 204**  
**Universidade de Aveiro - Departamento de Eletrónica, Telecomunicações e Informática**

### Equipa

| Função            | Nome                | Número    |
|-------------------|---------------------|-----------|
| Scrum Master      | Gonçalo Lima        | 108254    |
| Product Owner     | Xavier Machado      | 108019    |
| QA Engineer       | João Rodrigues      | 103947    |
| Service Analyst   | André Miragaia      | 108412    |
| DevOps Engineer   | Francisco Murcela   | 108815    |

### Repositório

- **GitHub**: https://github.com/detiuaveiro/group-project-es2526_204
---

Projeto académico desenvolvido para a unidade curricular de Engenharia de Software.  
Todos os direitos reservados © 2025 Grupo 204 - Universidade de Aveiro.
