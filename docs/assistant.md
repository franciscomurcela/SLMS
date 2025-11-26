# Conversational Assistant - Arquitetura e Implementação

## Visão Geral

Assistente conversacional integrado na aplicação SLMS para melhorar a interação de múltiplos tipos de utilizadores. O sistema permite consulta de informações através de conversação em linguagem natural, com funcionalidades adaptadas ao papel de cada utilizador.

**Utilizadores Suportados:**
- **Customer (Cliente)**: Rastreamento de encomendas pessoais
- **Driver (Motorista)**: Gestão de entregas e manifesto de carga
- **Warehouse (Armazém)**: Gestão de pedidos pendentes e processamento
- **Customer Service Representative (CSR)**: Suporte a rastreamento de encomendas de clientes

## Arquitetura

### Definição da Arquitetura

O assistente segue uma arquitetura de três camadas integrada no frontend React:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│                                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │         ChatAssistant Component                │     │
│  │  ┌──────────────┐  ┌─────────────────────────┐ │     │
│  │  │   UI Layer   │  │     Logic Layer         │ │     │
│  │  │  - Input     │  │  - Intent Recognition   │ │     │
│  │  │  - Messages  │  │  - UUID Detection       │ │     │
│  │  │  - Typing    │  │  - API Integration      │ │     │
│  │  └──────────────┘  └─────────────────────────┘ │     │
│  └────────────────────────────────────────────────┘     │
│                      │                                  │
│                      ▼                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │         Knowledge Base & API Layer             │     │
│  │  - Pattern Matching (chatbotKnowledgeBase.ts)  │     │
│  │  - API Calls (orderApi.ts)                     │     │
│  └────────────────────────────────────────────────┘     │
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

**Integração Multi-Role no Sistema Existente:**

1. **Frontend**: Componente `ChatAssistant` integrado em 4 páginas:
   - `PageCustomer.tsx` - Cliente
   - `Driver.tsx` - Motorista  
   - `PageWarehouse.tsx` - Armazém
   - `PageCustomerServiceRep.tsx` - CSR

2. **Autenticação**: Utiliza tokens Keycloak existentes (passados via props)
3. **API**: Comunica com endpoints REST já implementados (`/api/orders/my-orders/{keycloakId}`)
4. **Base de Dados**: PostgreSQL existente (tabelas Orders, Carrier, Costumer, Shipments, Driver)

**Props do Componente ChatAssistant:**
```typescript
interface ChatAssistantProps {
  onToggleOrderHistory?: () => void;  // Callback para abrir histórico (Customer)
  authToken?: string;                 // Token Keycloak
  customerId?: string;                // ID do utilizador (Keycloak sub)
  userRole?: string;                  // Papel do utilizador
  deliveryCount?: number;             // Contador de entregas (Driver)
  pendingCount?: number;              // Contador de pedidos pendentes (Warehouse)
}
```

**Fluxo de Integração:**
```
Página do Utilizador (ex: PageCustomer.tsx)
    ↓ (passa authToken, customerId, userRole, counters)
ChatAssistant.tsx
    ↓ (deteta UUID ou intenção baseada no role)
chatbotKnowledgeBase.ts + orderApi.ts
    ↓ (GET /api/orders/my-orders/{customerId})
Backend (OrderController.java)
    ↓ (SQL JOIN Orders + Carrier + Shipments)
PostgreSQL Database
```

## Racionalização do Design

### Decisões Arquiteturais

**1. Abordagem Frontend-First com Role-Based Logic**
- **Decisão**: Reconhecimento de intenções no frontend com pattern matching específico por role
- **Razão**: Simplicidade, sem dependências externas, resposta instantânea adaptada ao contexto

**2. Sistema de Roles e Filtros de Intenções**
- **Decisão**: Intenções têm campo `roles?: string[]` para controlo de acesso
- **Razão**: Diferentes utilizadores precisam de funcionalidades diferentes
- **Implementação**:
  ```typescript
  {
    id: 'track_order',
    patterns: ['rastrear', 'onde está', 'tracking'],
    responses: ['📦 Para rastrear sua encomenda...'],
    roles: ['Customer', 'Customer Service Representative', 'Logistics Manager']
  }
  ```
- **Benefício**: Mensagens contextualizadas e ações relevantes para cada papel

**3. Welcome Messages Personalizadas**
- **Decisão**: Função `getWelcomeMessage(userRole, deliveryCount, pendingCount)` dinâmica
- **Razão**: Primeira interação deve ser relevante ao contexto do utilizador
- **Exemplos**:
  - **Customer**: "📦 Pode consultar suas encomendas, rastrear pedidos..."
  - **Driver**: "🚚 Tem X entregas pendentes. Posso ajudar com..."
  - **Warehouse**: "📦 Tem X pedidos pendentes. Gestão de pedidos..."
  - **CSR**: "📞 Assistente para suporte ao cliente. Rastrear encomendas..."

**4. Contadores Dinâmicos (Context-Aware)**
- **Decisão**: Props opcionais `deliveryCount` e `pendingCount` passadas pelas páginas
- **Razão**: Fornecer informação imediata e relevante ao abrir o chat
- **Implementação**:
  - `Driver.tsx`: Procura o número de entregas via API de shipments
  - `PageWarehouse.tsx`: Conta pedidos com status "Pending"
  - Valores apresentados na mensagem de boas-vindas

**2. Deteção de Tracking ID**
- **Decisão**: Regex UUID pattern (`/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i`)
- **Razão**: IDs no sistema seguem formato UUID padrão
- **Roles Aplicáveis**: Customer, CSR, Logistics Manager
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

### Funcionalidades Implementadas por Role

#### **Customer (Cliente)** ✅
- Deteção automática de Tracking ID (UUID)
- Rastreamento de encomendas pessoais
- Histórico de pedidos
- Estados da encomenda com emojis e próximos passos

**Exemplo:**
```
User: d0d1fdf3-5e2f-420f-87ac-0396833b0aca
Assistant: 🟡 Informações da Encomenda
          Tracking ID: d0d1fdf3...
          Status: Pending
          Transportadora: FedEx
          ...
```

#### **Driver (Motorista)** ✅
- Consulta de entregas pendentes (contador em tempo real)
- Informações sobre manifesto de carga
- Instruções para confirmação de entregas
- Reporte de anomalias

**Intenções específicas:**
- "Quantas entregas tenho?" → Mostra contador de deliveryCount
- "Como ver manifesto?" → Instrução para aceder manifesto de carga
- "Como confirmar entrega?" → Passos para scan QR code
- "Reportar problema" → Instruções para anomalias

**Exemplo Welcome:**
```
👋 Bem-vindo ao Assistente SLMS, Motorista!
🚚 Tem 5 entregas pendentes.

Posso ajudar com:
• 📋 "Ver manifesto de carga"
• ✅ "Como confirmar entrega?"
• ⚠️ "Reportar anomalia"
```

#### **Warehouse (Armazém)** ✅
- Consulta de pedidos pendentes (contador em tempo real)
- Instruções de processamento de pedidos
- Ajuda na escolha de transportadoras
- Filtros de status

**Intenções específicas:**
- "Quantos pedidos pendentes?" → Mostra pendingCount
- "Como processar pedido?" → Instruções passo-a-passo
- "Escolher transportadora" → Critérios de seleção
- "Filtrar por status" → Como usar filtros

**Exemplo Welcome:**
```
👋 Bem-vindo ao Assistente SLMS, Armazém!
📦 Tem 12 pedidos pendentes.

Posso ajudar com:
• 📦 "Quantos pedidos pendentes?"
• 📋 "Como processar pedido?"
• 🚚 "Escolher transportadora"
```

#### **Customer Service Representative (CSR)** ✅
- Rastreamento de encomendas de clientes (via UUID)
- Consulta de status de pedidos
- Suporte a múltiplas encomendas

**Funcionalidades:**
- Mesmas capacidades de tracking que Customer
- Acesso a informações detalhadas
- Interface adaptada para suporte

**Exemplo Welcome:**
```
👋 Bem-vindo ao Assistente SLMS!
📞 Assistente para Representante de Atendimento ao Cliente.

Posso ajudar com:
• 📦 Rastrear encomendas
• 📋 Consultar status de pedidos
• 🔍 Localizar informações de clientes
```

### Fluxo de Conversação por Role

#### Customer / CSR Flow
```
1. Utilizador abre chat
   → Welcome message com opções de rastreamento

2. Utilizador cola UUID
   → Sistema deteta automaticamente
   → Busca informação da encomenda via API
   → Apresenta detalhes formatados com transportadora

3. Utilizador pergunta "Onde está minha encomenda?"
   → Sistema reconhece intenção 'track_order'
   → Pede UUID
   → Aguarda input com tracking ID

4. Utilizador fecha chat
   → Histórico mantido na sessão
```

#### Driver Flow
```
1. Driver abre chat
   → Welcome: "🚚 Tem X entregas pendentes"
   → Mostra opções específicas de driver

2. Driver: "Quantas entregas tenho?"
   → Mostra deliveryCount atualizado
   → Sugere aceder manifesto

3. Driver: "Como confirmar entrega?"
   → Instrução passo-a-passo
   → Menciona scan QR code + prova de entrega

4. Driver: "Reportar problema"
   → Orienta para formulário de anomalias
```

#### Warehouse Flow
```
1. Staff abre chat
   → Welcome: "📦 Tem X pedidos pendentes"
   → Opções de gestão de pedidos

2. Staff: "Como processar pedido?"
   → Passos: selecionar pedido → escolher transportadora → confirmar

3. Staff: "Escolher transportadora"
   → Critérios: custo médio, taxa de pontualidade, taxa de sucesso
   → Mostra onde encontrar informação

4. Staff: "Filtrar por status"
   → Explica filtros disponíveis (Pending, InTransit, Delivered)
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
│   ├── ChatAssistant.tsx          # Componente principal do chat (multi-role)
│   ├── ChatAssistant.css          # Estilos do chat
│   ├── PageCustomer.tsx           # Integração Customer
│   ├── Driver.tsx                 # Integração Driver
│   ├── PageWarehouse.tsx          # Integração Warehouse
│   └── PageCustomerServiceRep.tsx # Integração CSR
├── utils/
│   ├── chatbotKnowledgeBase.ts    # Intenções, welcome messages, role filtering
│   └── orderApi.ts                # Integração com API do backend
└── App.css                         # Estilos globais
```

### Backend

```
slms-backend/order_service/demo/src/main/java/.../controller/
└── OrderController.java            # Endpoint /my-orders (com JOIN Carrier + Shipments)
```

### Integrações por Página

| Página    | Componente                   | Props Passadas                                                |
|-----------|------------------------------|---------------------------------------------------------------|
| Customer  | `PageCustomer.tsx`           | `authToken`, `customerId`, `userRole`, `onToggleOrderHistory` |
| Driver    | `Driver.tsx`                 | `authToken`, `customerId`, `userRole`, `deliveryCount`        |
| Warehouse | `PageWarehouse.tsx`          | `authToken`, `customerId`, `userRole`, `pendingCount`         |
| CSR       | `PageCustomerServiceRep.tsx` | `authToken`, `customerId`, `userRole`                         |

## Testes Realizados

### Casos de Teste por Role

#### Customer & CSR
| Cenário                  | Input                                  | Resultado Esperado                 | Estado   |
|--------------------------|----------------------------------------|------------------------------------|----------|
| Tracking por Order ID    | `3d88f621-9667-4da9-8920-f85f21907195` | Detalhes da encomenda              | ✅ Pass |
| Tracking por Tracking ID | `d0d1fdf3-5e2f-420f-87ac-0396833b0aca` | Detalhes da encomenda              | ✅ Pass |
| Pergunta genérica        | "Onde está a minha encomenda?"         | Pede Tracking ID                   | ✅ Pass |
| UUID inválido            | `00000000-0000-0000-0000-000000000000` | Encomenda não encontrada           | ✅ Pass |
| Saudação                 | "Olá"                                  | Resposta de boas-vindas contextual | ✅ Pass |

#### Driver
| Cenário              | Input                     | Resultado Esperado                   | Estado   |
|----------------------|---------------------------|--------------------------------------|----------|
| Contador de entregas | Chat aberto               | Welcome mostra deliveryCount correto | ✅ Pass |
| Consulta entregas    | "Quantas entregas tenho?" | Mostra número atualizado             | ✅ Pass |
| Manifesto            | "Como ver manifesto?"     | Instruções para aceder manifesto     | ✅ Pass |
| Confirmar entrega    | "Como confirmar entrega?" | Passos com QR code                   | ✅ Pass |
| Anomalia             | "Reportar problema"       | Instruções para reporte              | ✅ Pass |

#### Warehouse
| Cenário            | Input                        | Resultado Esperado                  | Estado   |
|--------------------|------------------------------|-------------------------------------|----------|
| Contador pendentes | Chat aberto                  | Welcome mostra pendingCount correto | ✅ Pass |
| Consulta pendentes | "Quantos pedidos pendentes?" | Mostra número atualizado            | ✅ Pass |
| Processar pedido   | "Como processar?"            | Instruções passo-a-passo            | ✅ Pass |
| Transportadora     | "Escolher transportadora"    | Critérios de seleção                | ✅ Pass |
| Filtros            | "Filtrar por status"         | Explica filtros disponíveis         | ✅ Pass |

### Teste de Utilizador por Role

**Customer**: anacosta / anacosta  
**Driver**: marionunes / marionunes  
**Warehouse**: ricardocastro / ricardocastro  
**CSR**: camilasantos / camilasantos  

**URL**: http://localhost:3000 (Docker) ou http://localhost:5173 (desenvolvimento)

## Labels de Pull Request

Todos os PRs relacionados com esta funcionalidade devem incluir:
- **category:assistant** (obrigatório)

---

**Versão**: 1.0  
**Última Atualização**: 26 de Novembro de 2025  
**Estado**: ✅ Implementado e Testado
