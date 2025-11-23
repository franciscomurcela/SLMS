# Conversational Assistant - Arquitetura e Implementação

## Visão Geral

Assistente conversacional integrado na aplicação SLMS para melhorar a interação do utilizador, permitindo consulta de informações sobre encomendas através de conversação em linguagem natural.

## Arquitetura

### Definição da Arquitetura

O assistente segue uma arquitetura de três camadas integrada no frontend React:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         ChatAssistant Component                 │    │
│  │  ┌──────────────┐  ┌─────────────────────────┐ │    │
│  │  │   UI Layer   │  │     Logic Layer         │ │    │
│  │  │  - Input     │  │  - Intent Recognition   │ │    │
│  │  │  - Messages  │  │  - UUID Detection       │ │    │
│  │  │  - Typing    │  │  - API Integration      │ │    │
│  │  └──────────────┘  └─────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                      │                                   │
│                      ▼                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │         Knowledge Base & API Layer             │    │
│  │  - Pattern Matching (chatbotKnowledgeBase.ts) │    │
│  │  - API Calls (orderApi.ts)                     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │  Backend REST API        │
         │  /api/orders/my-orders   │
         │  (Autenticado Keycloak)  │
         └──────────────────────────┘
```

### Estratégia de Integração

#### Core Components

**ChatAssistant** (Main Component)
- Manages chat state (open/closed, messages, typing indicators)
- Handles user input and message flow
### Estratégia de Integração

**Integração no Sistema Existente:**

1. **Frontend**: Componente `ChatAssistant` integrado em `PageCustomer.tsx`
2. **Autenticação**: Utiliza tokens Keycloak existentes (passados via props)
3. **API**: Comunica com endpoints REST já implementados (`/api/orders/my-orders/{keycloakId}`)
4. **Base de Dados**: PostgreSQL existente (tabelas Orders, Carrier, Costumer)

**Fluxo de Integração:**
```
PageCustomer.tsx
    ↓ (passa authToken + customerId)
ChatAssistant.tsx
    ↓ (deteta UUID no input)
orderApi.ts
    ↓ (GET /api/orders/my-orders/{customerId})
Backend (OrderController.java)
    ↓ (SQL JOIN Orders + Carrier)
PostgreSQL Database
```

## Racionalização do Design

### Decisões Arquiteturais

**1. Abordagem Frontend-First**
- **Decisão**: Reconhecimento de intenções no frontend com pattern matching
- **Razão**: Simplicidade, sem dependências externas, resposta instantânea
- **Trade-off**: Menos flexível que soluções de IA, mas suficiente para MVP

**2. Deteção de Tracking ID**
- **Decisão**: Regex UUID pattern (`/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i`)
- **Razão**: IDs no sistema seguem formato UUID padrão
- **Benefício**: Deteção automática sem palavras-chave necessárias

**3. Reutilização de API Existente**
- **Decisão**: Usar endpoint `/my-orders` em vez de criar novo `/chat` endpoint
- **Razão**: Evita problemas de autenticação, aproveita código existente
- **Resultado**: Integração mais rápida e robusta

**4. Estado das Mensagens**
- **Decisão**: Estado local com `useState`, sem persistência
- **Razão**: Conversas curtas focadas em consultas rápidas
- **Futuro**: Pode adicionar localStorage se necessário

### Interface do Utilizador

**Padrões Seguidos:**
- Botão flutuante (canto inferior direito) - padrão de mercado
- Mensagens do utilizador à direita (azul)
- Mensagens do assistente à esquerda (cinza)
- Indicador de escrita (animação de 3 pontos)
- Scroll automático para última mensagem

**Acessibilidade:**
- Navegação por teclado (Enter para enviar)
- Contraste adequado (WCAG 2.1)
- Área de clique adequada (min 44x44px)

## Protótipo Funcional

### Funcionalidades Implementadas

**1. Deteção Automática de Tracking ID** ✅
```typescript
// Exemplo de uso:
User: "d0d1fdf3-5e2f-420f-87ac-0396833b0aca"
Assistant: [Apresenta detalhes completos da encomenda]
```

**2. Conversação em Linguagem Natural** ✅
```typescript
// Sistema de intenções:
{
  id: 'tracking',
  patterns: ['onde está', 'rastrear', 'tracking'],
  responses: ['Para rastrear, forneça o ID da encomenda...']
}
```

**3. Integração com API** ✅
- Chamadas autenticadas ao backend
- Formatação de resposta com informação de transportadora
- Tratamento de erros (encomenda não encontrada)

**4. Estados da Encomenda** ✅
- Pending: 🟡 Aguardando atribuição
- Assigned: 🟢 Transportadora atribuída
- In Transit: 🚚 Em trânsito
- Delivered: ✅ Entregue
- Cancelled: ❌ Cancelada
- Failed: ⚠️ Problema na entrega

### Fluxo de Conversação Básico

```
1. Utilizador abre chat
   → Mensagem de boas-vindas

2. Utilizador cola UUID
   → Sistema deteta automaticamente
   → Busca informação da encomenda
   → Apresenta detalhes formatados

3. Utilizador faz pergunta genérica
   → Sistema reconhece intenção
   → Responde com informação contextual
   → Sugere ações (se aplicável)

4. Utilizador fecha chat
   → Histórico mantido na sessão
   → Pode reabrir e continuar
```

### Exemplo de Resposta

```
🟡 Informações da Encomenda

Tracking ID: d0d1fdf3-5e2f-420f-87ac-0396833b0aca
Status: Pending
Origem: Rua das Flores, 120
Destino: Rua das Acácias, 145
Peso: 9.3 kg
Transportadora: Aguardando atribuição
Criado em: 15/10/2025, 13:40
Atualizado em: 15/10/2025, 13:40

⏳ Próximo passo: Aguardando atribuição de transportadora (1-2 horas)
```

## Ficheiros Implementados

### Frontend

```
react-frontend/frontend/src/
├── components/
│   └── ChatAssistant.tsx          # Componente principal do chat
├── utils/
│   ├── chatbotKnowledgeBase.ts    # Sistema de intenções e respostas
│   └── orderApi.ts                # Integração com API do backend
└── App.css                         # Estilos do chat
```

### Backend

```
slms-backend/order_service/demo/src/main/java/.../controller/
└── OrderController.java            # Endpoint /my-orders (melhorado com JOIN)
```

## Testes Realizados

### Casos de Teste

| Cenário | Input | Resultado Esperado | Estado |
|---------|-------|-------------------|---------|
| Tracking por Order ID | `3d88f621-9667-4da9-8920-f85f21907195` | Detalhes da encomenda | ✅ Pass |
| Tracking por Tracking ID | `d0d1fdf3-5e2f-420f-87ac-0396833b0aca` | Detalhes da encomenda | ✅ Pass |
| Pergunta genérica | "Onde está a minha encomenda?" | Pede Tracking ID | ✅ Pass |
| UUID inválido | `00000000-0000-0000-0000-000000000000` | Encomenda não encontrada | ✅ Pass |
| Texto sem UUID | "Olá" | Resposta de boas-vindas | ✅ Pass |

### Teste de Utilizador

**Conta de teste**: anacosta / anacosta  
**URL**: http://localhost:3000 (Docker) ou http://localhost:5173 (desenvolvimento)

## Labels de Pull Request

Todos os PRs relacionados com esta funcionalidade devem incluir:
- **category:assistant** (obrigatório)
- `enhancement` (tipo de alteração)
- `frontend` (camada afetada)

## Documentação Adicional

- **README Principal**: `/README.md` (secção "Funcionalidades Principais")
- **Este documento**: `/docs/assistant.md` (arquitetura e design)

---

**Versão**: 1.0  
**Última Atualização**: 23 de Novembro de 2025  
**Estado**: ✅ Implementado e Testado
