# 🚀 Allure - Guia Rápido

## 📊 Ver Relatórios Allure (Backend + Frontend)

### 1️⃣ Executar os Testes

```bash
# Backend - User Service
cd slms-backend/user_service
./mvnw clean test
cd ../..

# Frontend
cd react-frontend/frontend
npm run test:unit
cd ../..
```

### 2️⃣ Iniciar Container Allure

```bash
cd slms-backend
docker-compose -f docker-compose.allure.yml up -d
```

### 3️⃣ Ver Relatórios

Abrir no browser: **http://localhost:8080**

### 4️⃣ Parar Container

```bash
docker-compose -f docker-compose.allure.yml down
```

## 📁 Onde Ficam os Resultados?

```
slms-backend/
├── user_service/
│   └── allure-results/          ← Resultados aqui
├── order_service/demo/
│   └── allure-results/          ← Resultados aqui (quando houver testes)
└── carrier_service/carrier_service/
    └── allure-results/          ← Resultados aqui (quando houver testes)

react-frontend/frontend/
└── allure-results/              ← Resultados aqui
```

## 🔄 Regenerar Relatório

Sempre que executares novos testes:

```bash
# 1. Parar container
cd slms-backend
docker-compose -f docker-compose.allure.yml down

# 2. Executar novos testes (ver passo 1 acima)

# 3. Reiniciar container
docker-compose -f docker-compose.allure.yml up -d
```

## ✅ Verificar Se Há Resultados

```bash
# Backend
ls slms-backend/user_service/allure-results/

# Frontend  
ls react-frontend/frontend/allure-results/
```

## 🎯 CI/CD

O CI (GitHub Actions) gera os relatórios automaticamente e publica como artefactos.

Para ver os relatórios no GitHub:
1. Ir para **Actions** → Workflow run
2. Scroll down até **Artifacts**
3. Download `allure-report-*`
