# 📊 Allure Report Container - SLMS Backend

Container Docker para gerar e visualizar relatórios Allure dos testes de **todos os serviços** do backend.

## 🚀 Como Usar

### 1. Executar Testes de Todos os Serviços

```bash
# Na raiz do slms-backend/

# User Service
cd user_service && mvn clean test && cd ..

# Order Service
cd order_service/demo && mvn clean test && cd ../..

# Carrier Service
cd carrier_service/carrier_service && mvn clean test && cd ../..
```

### 2. Ver Relatórios Consolidados

```bash
# Na raiz do slms-backend/
docker-compose -f docker-compose.allure.yml up -d

# Aceder ao relatório em: http://localhost:8080
```

### 3. Parar o Container

```bash
docker-compose -f docker-compose.allure.yml down
```

## 📁 Estrutura

```
slms-backend/
├── Dockerfile.allure              ← Imagem Docker com Allure
├── docker-compose.allure.yml      ← Configuração do container
├── README-ALLURE.md              ← Este ficheiro
├── allure-report/                ← Relatório consolidado (gerado)
├── user_service/
│   └── allure-results/           ← Resultados dos testes
├── order_service/demo/
│   └── allure-results/           ← Resultados dos testes
└── carrier_service/carrier_service/
    └── allure-results/           ← Resultados dos testes
```

## 🔧 Comandos Úteis

### Executar testes de um serviço específico

```bash
# User Service
cd user_service && mvn clean test && cd ..

# Order Service
cd order_service/demo && mvn clean test && cd ../..

# Carrier Service
cd carrier_service/carrier_service && mvn clean test && cd ../..
```

### Ver apenas relatório de um serviço

Se quiseres ver apenas os resultados de um serviço, podes criar um `docker-compose` temporário ou modificar os volumes no ficheiro principal.

### Regenerar Relatório

```bash
# Parar container
docker-compose -f docker-compose.allure.yml down

# Executar novos testes (dos serviços que mudaram)
cd user_service && mvn clean test && cd ..

# Reiniciar container
docker-compose -f docker-compose.allure.yml up -d
```

### Gerar relatório estático (sem servir)

```bash
docker run --rm \
  -v ${PWD}/user_service/allure-results:/app/allure-results/user_service:ro \
  -v ${PWD}/order_service/demo/allure-results:/app/allure-results/order_service:ro \
  -v ${PWD}/carrier_service/carrier_service/allure-results:/app/allure-results/carrier_service:ro \
  -v ${PWD}/allure-report:/app/allure-report \
  $(docker build -q -f Dockerfile.allure .) \
  generate allure-results -o allure-report --clean
```

## 🎯 Vantagens

✅ **Consolidado**: Um único relatório com todos os serviços  
✅ **Sem instalação local**: Não precisa instalar Allure  
✅ **Consistente**: Mesmo ambiente para toda a equipa  
✅ **Interativo**: Acesso via browser ao relatório  
✅ **CI/CD Ready**: Fácil integração nos workflows  

## 📝 Notas

- Os resultados Allure são montados como **read-only** (`:ro`) para segurança
- O container precisa que pelo menos um serviço tenha executado testes
- Se um serviço não tiver `allure-results/`, o container ignora-o automaticamente
- Os relatórios são servidos em `http://localhost:8080`
