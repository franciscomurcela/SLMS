# 🧪 Guia de Testes - Frontend SLMS

## 📋 Índice
- [Tipos de Testes](#tipos-de-testes)
- [Executar Testes](#executar-testes)
- [Relatórios Allure](#relatórios-allure)
- [CI/CD](#cicd)
- [Estrutura](#estrutura)

---

## 🔬 Tipos de Testes

### 1. **Testes Unitários** (Vitest)
Testam componentes individuais e funções em isolamento.

**Localização:** `src/__unit__/*.test.tsx`

**Cobertura atual:**
- ✅ OrdersPanel - Renderização de pedidos
- ✅ Header - Import e validação de componente
- ✅ Utils - Formatação de strings, números e datas

### 2. **Testes End-to-End (E2E)** (Cypress)
Testam fluxos completos da aplicação no navegador.

**Localização:** `cypress/e2e/*.cy.js`

**Cenários cobertos:**
- ✅ Smoke test - Aplicação carrega corretamente
- ✅ Warehouse Orders - Lista e manipulação de pedidos

### 3. **Testes Estáticos** (ESLint)
Análise estática de código para identificar problemas.

---

## 🚀 Executar Testes

### Testes Unitários
```bash
# Executar todos os testes unitários
npm run test:unit

# Executar com coverage
npm run test:unit:coverage
```

### Testes E2E
```bash
# Executar E2E em modo headless (CI)
npm run test:e2e

# Executar E2E com interface gráfica
npm run test:e2e:headed

# Ou diretamente:
npm run cypress:open
npm run cypress:run
```

### Lint (Análise Estática)
```bash
npm run lint
```

### Todos os Testes + Allure Report
```bash
npm run test:allure
```

---

## 📊 Relatórios Allure

### Gerar Relatório Local
```bash
# Gerar relatório HTML
npm run allure:generate

# Gerar e abrir no navegador
npm run allure:serve
```

### Visualizar Relatórios no CI/CD

Após o pipeline executar, os relatórios ficam disponíveis como **artifacts** no GitHub Actions:

1. Acede à página do workflow no GitHub
2. Clica no job que executou
3. Na secção "Artifacts", faz download de:
   - `allure-report-frontend` (testes do frontend)
   - `allure-report-user_service` (backend)
   - `allure-report-order_service` (backend)
   - `allure-report-carrier_service` (backend)

---

## 🔄 CI/CD

### Workflow CI (`ci.yml`)
Executa em **todos os branches** em push/PR:
- ✅ Lint frontend
- ✅ Testes unitários
- ✅ Cobertura de testes
- ✅ Build frontend
- ✅ Testes backend (Maven)
- 📊 Gera relatórios Allure

### Workflow CD (`cd.yml`)
Executa apenas em `master` e `cd-test`:
- ✅ Todos os passos do CI
- ✅ Testes E2E (Cypress)
- 🐳 Build e push Docker images
- 🚀 Deploy automático
- 📊 Relatórios Allure completos

---

## 📁 Estrutura de Ficheiros

```
react-frontend/frontend/
├── src/
│   ├── __unit__/              # Testes unitários
│   │   ├── App.unit.test.tsx
│   │   ├── Header.unit.test.tsx
│   │   └── Utils.unit.test.tsx
│   ├── components/            # Componentes React
│   └── ...
├── cypress/
│   ├── e2e/                   # Testes E2E
│   │   ├── dummy.cy.js
│   │   └── warehouse-orders.cy.js
│   ├── support/               # Configuração Cypress
│   └── fixtures/              # Dados de teste
├── scripts/
│   └── convert-to-allure.js   # Conversor Vitest → Allure
├── test-results/              # Resultados JSON/JUnit
├── allure-results/            # Resultados Allure (raw)
├── allure-report/             # Relatório HTML final
├── vitest.config.ts           # Config Vitest
└── cypress.config.ts          # Config Cypress
```

---

## 🛠️ Tecnologias

- **Vitest** - Testes unitários rápidos
- **Testing Library** - Testes de componentes React
- **Cypress** - Testes E2E
- **Allure** - Relatórios visuais
- **ESLint** - Linting
- **GitHub Actions** - CI/CD

---

## 📝 Adicionar Novos Testes

### Teste Unitário
```typescript
// src/__unit__/MeuComponente.unit.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MeuComponente from '../components/MeuComponente';

describe('MeuComponente', () => {
  it('renderiza corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText('Texto esperado')).toBeInTheDocument();
  });
});
```

### Teste E2E
```javascript
// cypress/e2e/meu-teste.cy.js
describe('Minha funcionalidade', () => {
  it('faz algo importante', () => {
    cy.visit('/pagina');
    cy.get('button').click();
    cy.contains('Sucesso').should('be.visible');
  });
});
```

---

## 🐛 Troubleshooting

### "No test results found"
→ Certifica-te que executaste `npm run test:unit` antes de gerar o relatório

### Cypress não encontra elementos
→ Verifica se o servidor está a correr: `npm run dev`

### Erro ao gerar Allure
→ Limpa os diretórios:
```bash
rm -rf allure-results allure-report test-results
npm run test:unit
npm run allure:generate
```

---

## 📈 Métricas de Qualidade

### Cobertura Mínima
- **Unitários**: 70%
- **E2E**: Fluxos críticos cobertos
- **Lint**: 0 erros

### Critérios de Aceitação
✅ Todos os testes passam no CI  
✅ Cobertura mínima atingida  
✅ Sem erros de lint  
✅ Build com sucesso  

---

## 🤝 Contribuir

Ao adicionar novos features:
1. Escreve testes unitários
2. Adiciona testes E2E se necessário
3. Verifica que todos os testes passam localmente
4. Gera relatório Allure e verifica

---

**Última atualização:** 30 de Outubro de 2025
