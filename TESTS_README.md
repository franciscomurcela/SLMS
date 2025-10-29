
# Testes Implementados e Integrados no CI/CD

Este projeto cobre e executa automaticamente no pipeline CI/CD os principais tipos de testes de software:


## 1. Teste Estático (Static Analysis)

- **Backend (Java):**
  - **Ferramenta:** Checkstyle
  - **Como roda:** Executado via plugin Maven (`mvn checkstyle:check`).
  - **CI/CD:** O pipeline executa o checkstyle antes do build/deploy.

- **Frontend (TypeScript/React):**
  - **Ferramenta:** ESLint
  - **Como roda:** Executado via script `npm run lint`.
  - **CI/CD:** O pipeline executa o lint antes do build/deploy.
  - **Arquivo de configuração:** `react-frontend/frontend/eslint.config.js`


## 2. Teste Unitário (Unit Test)

- **Backend (Java):**
  - **Ferramenta:** JUnit
  - **Como roda:** Executado via `mvn test`.
  - **Arquivo exemplo:** `user_service/src/test/java/es204/user_service/model/UserDTOTest.java`

- **Frontend (React):**
  - **Ferramenta:** Testing Library/Jest
  - **Como roda:** Executado via `npm run test`.
  - **Arquivo exemplo:** `react-frontend/frontend/src/__tests__/App.unit.test.tsx`

## 3. Teste de Integração (Integration Test)

- **Backend (Java):**
  - **Ferramenta:** JUnit + SpringBootTest
  - **Como roda:** Executado via `mvn test`.
  - **Arquivo exemplo:** `user_service/src/test/java/es204/user_service/UserServiceIntegrationTest.java`


## 4. Teste End-to-End (E2E)

- **Frontend (React):**
  - **Ferramenta:** Playwright
  - **Como roda:** Executado via `npm run test:e2e` (requer app rodando localmente e Playwright configurado).
  - **Arquivo exemplo:** `react-frontend/frontend/src/__tests__/App.e2e.test.ts`

---

## Como Executar Manualmente

### Backend (Java)
- **Unitários, Integração e Estático:**
  ```sh
  cd slms-backend/user_service
  mvn test
  mvn checkstyle:check
  ```

### Frontend (React)
- **Estático:**
  ```sh
  cd react-frontend/frontend
  npm run lint
  ```
- **Unitários:**
  ```sh
  npm run test
  ```
- **E2E:**
  ```sh
  npm run test:e2e
  ```

---

## Observações
- Todos esses testes são executados automaticamente no pipeline CI/CD antes do build e deploy.
- O deploy só ocorre se todos os testes passarem.
- Para rodar os testes E2E, a aplicação frontend deve estar rodando localmente.
- Adapte os comandos conforme o seu ambiente.
