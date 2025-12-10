/**
 * RAG (Retrieval-Augmented Generation) Knowledge Base for SLMS Chatbot
 * 
 * This module provides domain-specific context to enhance the chatbot's responses
 * about the Smart Logistics Management System.
 * 
 * @module chatbotRAG
 */

export interface RAGContext {
  type: 'order_status' | 'shipment_info' | 'delivery_process' | 'tracking' | 'faq' | 'features';
  content: string;
  relevance: number; // 0-1 score
  metadata?: Record<string, unknown>;
}

export interface OrderStatusInfo {
  status: string;
  description: string;
  nextSteps: string[];
  estimatedTime?: string;
}

/**
 * Knowledge base about SLMS system features and processes
 */
export const SLMS_KNOWLEDGE_BASE = {
  /**
   * Order Status Information
   */
  orderStatuses: {
    'Pendente': {
      status: 'Pendente',
      description: 'Encomenda criada e aguardando atribuição a uma transportadora.',
      nextSteps: [
        'Sistema está procurando a melhor transportadora disponível',
        'Receberá notificação quando for atribuída',
        'Tracking ID será gerado automaticamente'
      ],
      estimatedTime: '1-2 horas'
    },
    'Atribuído': {
      status: 'Atribuído',
      description: 'Encomenda atribuída a uma transportadora e aguardando pickup.',
      nextSteps: [
        'Transportadora foi notificada',
        'Driver será designado em breve',
        'Pode acompanhar através do Tracking ID'
      ],
      estimatedTime: '2-6 horas'
    },
    'Em Trânsito': {
      status: 'Em Trânsito',
      description: 'Encomenda está em rota de entrega.',
      nextSteps: [
        'Acompanhe a localização em tempo real',
        'Receberá notificação quando estiver próximo',
        'Prepare-se para receber a entrega'
      ],
      estimatedTime: 'Conforme rota definida'
    },
    'Entregue': {
      status: 'Entregue',
      description: 'Encomenda foi entregue com sucesso.',
      nextSteps: [
        'Verificar Proof of Delivery (POD)',
        'Confirmar recebimento',
        'Avaliar serviço (opcional)'
      ],
      estimatedTime: 'Concluído'
    },
    'Cancelado': {
      status: 'Cancelado',
      description: 'Encomenda foi cancelada.',
      nextSteps: [
        'Verificar motivo do cancelamento',
        'Contactar suporte se necessário',
        'Criar nova encomenda se desejar'
      ],
      estimatedTime: 'N/A'
    },
    'Failed': {
      status: 'Failed',
      description: 'Falha na entrega. Requer atenção.',
      nextSteps: [
        'Verificar mensagem de erro',
        'Contactar transportadora',
        'Reagendar entrega se possível'
      ],
      estimatedTime: 'Pendente resolução'
    }
  } as Record<string, OrderStatusInfo>,

  /**
   * System Features and Capabilities
   */
  features: [
    {
      name: 'Rastreamento em Tempo Real',
      description: 'Acompanhe sua encomenda em tempo real através do Tracking ID',
      howToUse: 'Na página Customer, insira o Tracking ID no campo de busca ou visualize no seu histórico de pedidos',
      benefits: ['Transparência total', 'Atualizações automáticas', 'Notificações push']
    },
    {
      name: 'Histórico de Encomendas',
      description: 'Visualize todas as suas encomendas anteriores e atuais',
      howToUse: 'Clique em "Ver Histórico de Encomendas" na sua dashboard',
      benefits: ['Acesso rápido', 'Filtros por status', 'Download de documentos']
    },
    {
      name: 'Proof of Delivery (POD)',
      description: 'Comprovação digital da entrega com foto ou assinatura',
      howToUse: 'Após entrega, acesse os detalhes da encomenda para ver o POD',
      benefits: ['Segurança', 'Comprovação legal', 'Resolução de disputas']
    },
    {
      name: 'Gestão de Anomalias',
      description: 'Sistema para reportar e resolver problemas nas entregas',
      howToUse: 'Drivers podem reportar anomalias durante a rota',
      benefits: ['Resposta rápida', 'Comunicação transparente', 'Registro de incidentes']
    },
    {
      name: 'Multi-Transportadora',
      description: 'Sistema integrado com múltiplas transportadoras',
      howToUse: 'Automaticamente seleciona a melhor transportadora para sua entrega',
      benefits: ['Otimização de custos', 'Melhor cobertura', 'Backup automático']
    }
  ],

  /**
   * Frequently Asked Questions
   */
  faqs: [
    {
      question: 'Como rastreio minha encomenda?',
      answer: 'Use o Tracking ID fornecido no email de confirmação. Pode inseri-lo na página de rastreamento ou visualizar diretamente no seu histórico de encomendas.',
      category: 'tracking',
      relatedEndpoints: ['/api/orders/track/{trackingId}']
    },
    {
      question: 'Quanto tempo demora a entrega?',
      answer: 'O tempo de entrega depende da distância e transportadora. Normalmente: Local (1-2 dias), Nacional (3-5 dias), Internacional (7-15 dias). Consulte o status da sua encomenda para estimativa específica.',
      category: 'delivery',
      relatedEndpoints: ['/api/orders/{orderId}']
    },
    {
      question: 'O que é Proof of Delivery (POD)?',
      answer: 'POD é uma comprovação digital (foto ou assinatura) que confirma a entrega da encomenda. É capturada pelo driver no momento da entrega e fica disponível nos detalhes da encomenda.',
      category: 'delivery',
      relatedEndpoints: ['/api/orders/{orderId}']
    },
    {
      question: 'Como vejo meu histórico de encomendas?',
      answer: 'Na sua dashboard de Customer, clique no botão "Ver Histórico de Encomendas". Pode filtrar por status, data, ou transportadora.',
      category: 'orders',
      relatedEndpoints: ['/api/orders/my-orders/{keycloakId}']
    },
    {
      question: 'O que fazer se a entrega falhar?',
      answer: 'Verificue a mensagem de erro nos detalhes da encomenda. Pode contactar a transportadora diretamente ou nossa equipe de suporte. O sistema permite reagendar automaticamente em alguns casos.',
      category: 'problems',
      relatedEndpoints: ['/api/orders/report-anomaly']
    },
    {
      question: 'Como criar uma nova encomenda?',
      answer: 'Na página de Customer, clique em "Nova Encomenda". Preencha origem, destino, peso e dados do destinatário. O sistema atribuirá automaticamente a melhor transportadora.',
      category: 'orders',
      relatedEndpoints: ['/api/orders']
    },
    {
      question: 'Posso cancelar uma encomenda?',
      answer: 'Sim, encomendas com status "Pendente" ou "Atribuído" podem ser canceladas. Após o driver iniciar a rota, cancelamento não é possível.',
      category: 'orders',
      relatedEndpoints: ['/api/orders/{orderId}']
    },
    {
      question: 'Como funciona o sistema de notificações?',
      answer: 'Receberá notificações automáticas via email para: criação de encomenda, atribuição a transportadora, início de trânsito, proximidade de entrega, e conclusão.',
      category: 'notifications',
      relatedEndpoints: ['/api/notifications']
    }
  ],

  /**
   * System Endpoints Documentation (for context)
   */
  endpoints: {
    orders: {
      getAll: {
        method: 'GET',
        path: '/api/orders',
        description: 'Lista todas as encomendas (admin/carrier)',
        authentication: 'Required',
        roles: ['admin', 'carrier']
      },
      getMyOrders: {
        method: 'GET',
        path: '/api/orders/my-orders/{keycloakId}',
        description: 'Lista encomendas do customer autenticado',
        authentication: 'Required',
        roles: ['customer']
      },
      trackOrder: {
        method: 'GET',
        path: '/api/orders/track/{trackingId}',
        description: 'Rastreia encomenda por Tracking ID (público)',
        authentication: 'Optional',
        roles: ['any']
      },
      createOrder: {
        method: 'POST',
        path: '/api/orders',
        description: 'Cria nova encomenda',
        authentication: 'Required',
        roles: ['customer'],
        requiredFields: ['customerId', 'originAddress', 'destinationAddress', 'weight']
      },
      confirmDelivery: {
        method: 'POST',
        path: '/api/orders/confirm-delivery',
        description: 'Confirma entrega com POD (driver)',
        authentication: 'Required',
        roles: ['driver'],
        requiredFields: ['orderId', 'pod']
      },
      reportAnomaly: {
        method: 'POST',
        path: '/api/orders/report-anomaly',
        description: 'Reporta anomalia na entrega',
        authentication: 'Required',
        roles: ['driver'],
        requiredFields: ['orderId', 'errorMessage']
      }
    },
    shipments: {
      getAll: {
        method: 'GET',
        path: '/api/shipments',
        description: 'Lista todos os shipments',
        authentication: 'Required',
        roles: ['admin', 'carrier']
      },
      getByDriver: {
        method: 'GET',
        path: '/api/shipments/driver/{driverId}',
        description: 'Lista shipments de um driver específico',
        authentication: 'Required',
        roles: ['driver', 'carrier']
      },
      getMyShipments: {
        method: 'GET',
        path: '/api/shipments/my-shipments/{keycloakId}',
        description: 'Lista shipments do driver autenticado',
        authentication: 'Required',
        roles: ['driver']
      }
    }
  },

  /**
   * Delivery Process Steps
   */
  deliveryProcess: [
    {
      step: 1,
      name: 'Criação da Encomenda',
      description: 'Customer cria encomenda com detalhes de origem, destino e peso',
      actors: ['Customer'],
      duration: '< 1 minuto',
      outputs: ['Order ID', 'Tracking ID']
    },
    {
      step: 2,
      name: 'Atribuição Automática',
      description: 'Sistema seleciona melhor transportadora baseado em disponibilidade, localização e custo',
      actors: ['Sistema'],
      duration: '1-2 horas',
      outputs: ['Carrier ID', 'Shipment ID']
    },
    {
      step: 3,
      name: 'Designação de Driver',
      description: 'Transportadora atribui driver e cria rota de entrega',
      actors: ['Carrier', 'Logistics Manager'],
      duration: '2-6 horas',
      outputs: ['Driver ID', 'Route ID', 'ETA']
    },
    {
      step: 4,
      name: 'Coleta (Pickup)',
      description: 'Driver recolhe encomenda no endereço de origem',
      actors: ['Driver'],
      duration: 'Conforme rota',
      outputs: ['Status: Em Trânsito', 'Timestamp de coleta']
    },
    {
      step: 5,
      name: 'Transporte',
      description: 'Encomenda em rota para destino. Rastreamento em tempo real ativo',
      actors: ['Driver'],
      duration: 'Conforme distância',
      outputs: ['Localizações GPS', 'ETAs atualizados']
    },
    {
      step: 6,
      name: 'Entrega',
      description: 'Driver entrega encomenda e captura POD (foto ou assinatura)',
      actors: ['Driver', 'Recipient'],
      duration: '< 10 minutos',
      outputs: ['Status: Entregue', 'POD', 'Timestamp de entrega']
    },
    {
      step: 7,
      name: 'Confirmação',
      description: 'Sistema atualiza status e notifica customer',
      actors: ['Sistema'],
      duration: 'Imediato',
      outputs: ['Notificação', 'POD disponível', 'Shipment concluído']
    }
  ]
};

/**
 * Retrieves relevant context based on user's message
 * This is a simple keyword-based retrieval. In production, use vector embeddings.
 */
export function retrieveContext(userMessage: string): RAGContext[] {
  const contexts: RAGContext[] = [];
  const messageLower = userMessage.toLowerCase();

  // Check for order status queries
  const statusKeywords = ['status', 'estado', 'onde está', 'situação', 'andamento'];
  if (statusKeywords.some(keyword => messageLower.includes(keyword))) {
    Object.values(SLMS_KNOWLEDGE_BASE.orderStatuses).forEach(statusInfo => {
      if (messageLower.includes(statusInfo.status.toLowerCase())) {
        contexts.push({
          type: 'order_status',
          content: `Status: ${statusInfo.status}\n${statusInfo.description}\nPróximos passos: ${statusInfo.nextSteps.join(', ')}`,
          relevance: 0.9,
          metadata: statusInfo as Record<string, unknown>
        });
      }
    });
  }

  // Check for tracking queries
  const trackingKeywords = ['rastreio', 'rastrear', 'tracking', 'acompanhar', 'localização'];
  if (trackingKeywords.some(keyword => messageLower.includes(keyword))) {
    const trackingFaq = SLMS_KNOWLEDGE_BASE.faqs.find(faq => faq.category === 'tracking');
    if (trackingFaq) {
      contexts.push({
        type: 'tracking',
        content: `${trackingFaq.question}\n${trackingFaq.answer}`,
        relevance: 0.85,
        metadata: { endpoints: trackingFaq.relatedEndpoints }
      });
    }
  }

  // Check for delivery process queries
  const processKeywords = ['processo', 'etapas', 'como funciona', 'passo a passo', 'workflow'];
  if (processKeywords.some(keyword => messageLower.includes(keyword))) {
    const processDescription = SLMS_KNOWLEDGE_BASE.deliveryProcess
      .map(step => `${step.step}. ${step.name} (${step.duration}): ${step.description}`)
      .join('\n');
    contexts.push({
      type: 'delivery_process',
      content: `Processo de Entrega SLMS:\n${processDescription}`,
      relevance: 0.8,
      metadata: { steps: SLMS_KNOWLEDGE_BASE.deliveryProcess }
    });
  }

  // Check for feature queries
  const featureKeywords = ['funcionalidade', 'recurso', 'feature', 'pode fazer', 'oferece'];
  if (featureKeywords.some(keyword => messageLower.includes(keyword))) {
    const featuresDescription = SLMS_KNOWLEDGE_BASE.features
      .map(f => `- ${f.name}: ${f.description}`)
      .join('\n');
    contexts.push({
      type: 'features',
      content: `Funcionalidades do SLMS:\n${featuresDescription}`,
      relevance: 0.75,
      metadata: { features: SLMS_KNOWLEDGE_BASE.features }
    });
  }

  // Check for FAQ matches
  const faqMatches = SLMS_KNOWLEDGE_BASE.faqs.filter(faq => 
    messageLower.includes(faq.question.toLowerCase().substring(0, 20)) ||
    faq.question.toLowerCase().includes(messageLower.substring(0, 15))
  );
  faqMatches.forEach(faq => {
    contexts.push({
      type: 'faq',
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      relevance: 0.9,
      metadata: { category: faq.category, endpoints: faq.relatedEndpoints }
    });
  });

  // Sort by relevance
  return contexts.sort((a, b) => b.relevance - a.relevance).slice(0, 3); // Top 3 most relevant
}

/**
 * Builds system prompt with injected RAG context
 */
export function buildSystemPrompt(userMessage: string, userContext?: { role?: string; userId?: string }): string {
  const contexts = retrieveContext(userMessage);
  
  let systemPrompt = `Você é um assistente virtual do SLMS (Smart Logistics Management System), especializado em ajudar com questões sobre encomendas, rastreamento e entregas.

**Informações do Sistema:**
- O SLMS é um sistema de gestão logística que conecta customers, transportadoras e drivers
- Suporta rastreamento em tempo real, múltiplas transportadoras e proof of delivery (POD)
- Principais roles: Customer (cria encomendas), Carrier (gerencia entregas), Driver (executa rotas)

`;

  if (userContext?.role) {
    systemPrompt += `**Contexto do Usuário:**
- Role atual: ${userContext.role}
- User ID: ${userContext.userId || 'N/A'}

`;
  }

  if (contexts.length > 0) {
    systemPrompt += `**Contexto Relevante para esta pergunta:**\n\n`;
    contexts.forEach((ctx, idx) => {
      systemPrompt += `${idx + 1}. [${ctx.type}] (Relevância: ${(ctx.relevance * 100).toFixed(0)}%)\n${ctx.content}\n\n`;
    });
  }

  systemPrompt += `**Instruções:**
- Seja claro, conciso e amigável
- Use emojis ocasionalmente para tornar mais amigável
- Se a pergunta for sobre funcionalidades específicas, explique passo a passo
- Se não souber a resposta, seja honesto e sugira contactar suporte
- Sempre que possível, forneça ações concretas (ex: "Clique em...", "Acesse...")
- Para tracking IDs, mencione que podem ser encontrados no email de confirmação ou histórico

Responda à seguinte pergunta do usuário com base no contexto fornecido:`;

  return systemPrompt;
}

/**
 * Example: How to use in backend
 * 
 * ```typescript
 * import { buildSystemPrompt } from './chatbotRAG';
 * 
 * const userMessage = "Como rastreio minha encomenda?";
 * const systemPrompt = buildSystemPrompt(userMessage, { role: 'customer', userId: '123' });
 * 
 * // Send to OpenAI/Anthropic
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [
 *     { role: "system", content: systemPrompt },
 *     { role: "user", content: userMessage }
 *   ]
 * });
 * ```
 */
