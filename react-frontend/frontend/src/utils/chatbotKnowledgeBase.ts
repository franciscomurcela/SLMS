// Knowledge base for the chatbot - stores intents, patterns, and responses

// UUID regex pattern for tracking IDs
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export interface Intent {
  id: string;
  patterns: string[];
  responses: string[];
  actions?: string[];
  priority?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export const intents: Intent[] = [
  {
    id: 'greeting',
    patterns: [
      'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hi', 'hello', 'hey'
    ],
    responses: [
      '👋 Olá! Como posso ajudar hoje?',
      '🙂 Bom dia! Em que posso ser útil?',
      '👋 Olá! Estou aqui para ajudar com suas encomendas.'
    ],
    priority: 1
  },
  {
    id: 'track_order',
    patterns: [
      'rastrear', 'onde está', 'tracking', 'track', 'encomenda', 'pedido',
      'localizar', 'encontrar pedido', 'estado da encomenda', 'status'
    ],
    responses: [
      '📦 Para rastrear sua encomenda, por favor forneça o número do pedido ou ID de rastreamento.',
      '🔍 Posso ajudar a localizar sua encomenda. Você tem o número do pedido?',
      '📍 Vou ajudar a rastrear seu pedido. Qual o ID da encomenda?'
    ],
    actions: ['show_tracking_input']
  },
  {
    id: 'order_history',
    patterns: [
      'histórico', 'historico', 'lista', 'minhas encomendas', 'meus pedidos',
      'todas as encomendas', 'ver pedidos', 'listar', 'history'
    ],
    responses: [
      '📋 Clique no botão "Ver Histórico de Encomendas" acima para visualizar todos os seus pedidos.',
      '✅ Pode ver o histórico completo clicando no botão de histórico na parte superior da página.',
      '📝 O botão "Histórico de Encomendas" mostra todos os seus pedidos anteriores.'
    ],
    actions: ['toggle_order_history']
  },
  {
    id: 'delivery_status',
    patterns: [
      'quando chega', 'previsão', 'entrega', 'delivery', 'quando recebo',
      'data de entrega', 'prazo', 'tempo de entrega'
    ],
    responses: [
      '🚚 O prazo de entrega depende da transportadora escolhida. Qual o número do seu pedido?',
      '⏰ Posso verificar a previsão de entrega. Tem o ID de rastreamento?',
      '📅 Para saber a data prevista, preciso do número do pedido.'
    ]
  },
  {
    id: 'help',
    patterns: [
      'ajuda', 'help', 'o que pode fazer', 'funcionalidades', 'comandos',
      'what can you do', 'como funciona', 'instruções'
    ],
    responses: [
      `🤖 Posso ajudar com:
      
• 📦 Rastrear encomendas
• 📋 Ver histórico de pedidos
• 🚚 Informações sobre entregas
• ❓ Responder perguntas frequentes

Basta digitar sua dúvida!`
    ],
    priority: 2
  },
  {
    id: 'create_order',
    patterns: [
      'novo pedido', 'criar encomenda', 'fazer pedido', 'enviar',
      'new order', 'create order', 'quero enviar'
    ],
    responses: [
      '📦 Para criar um novo pedido, entre em contacto com o suporte através do email suporte@slms.pt',
      '✉️ Novos pedidos devem ser criados através do portal ou email: suporte@slms.pt'
    ]
  },
  {
    id: 'contact',
    patterns: [
      'contacto', 'contato', 'suporte', 'falar com atendente', 'telefone',
      'email', 'contact', 'support'
    ],
    responses: [
      `📞 Pode contactar-nos:

📧 Email: suporte@slms.pt
☎️ Telefone: +351 234 370 200
⏰ Horário: Seg-Sex 9h-18h`
    ]
  },
  {
    id: 'thanks',
    patterns: [
      'obrigado', 'obrigada', 'thanks', 'thank you', 'valeu', 'agradeço'
    ],
    responses: [
      '😊 De nada! Estou sempre aqui para ajudar.',
      '🙂 Por nada! Se precisar de mais alguma coisa, é só perguntar.',
      '✨ Fico feliz em ajudar! Volte sempre que precisar.'
    ],
    priority: 1
  },
  {
    id: 'goodbye',
    patterns: [
      'tchau', 'adeus', 'até logo', 'bye', 'goodbye', 'até mais'
    ],
    responses: [
      '👋 Até logo! Tenha um ótimo dia!',
      '🙂 Adeus! Volte sempre que precisar.',
      '✨ Até breve! Boa sorte com suas encomendas!'
    ],
    priority: 1
  }
];

export const fallbackResponses = [
  '🤔 Desculpe, não entendi bem. Pode reformular a pergunta?',
  '❓ Não tenho certeza sobre isso. Pode tentar perguntar de outra forma?',
  '💭 Hmm, não compreendi. Tente perguntar sobre rastreamento, histórico ou ajuda.',
  `😅 Ainda estou aprendendo! Posso ajudar com:
  
• 📦 Rastreamento de encomendas
• 📋 Histórico de pedidos
• 🚚 Informações sobre entregas

Ou digite "ajuda" para ver todas as opções.`
];

export const welcomeMessage = `👋 **Bem-vindo ao Assistente SLMS!**

Posso ajudar com suas encomendas. O que deseja saber?

**Perguntas comuns:**
• 📦 "Onde está minha encomenda?"
• 📋 "Ver meu histórico de pedidos"
• 🚚 "Quando minha entrega chega?"
• ❓ "Ajuda"`;

// Utility function to extract tracking ID (UUID) from message
export function extractTrackingId(userMessage: string): string | null {
  console.log('[DEBUG] extractTrackingId called with:', userMessage);
  const match = userMessage.match(UUID_PATTERN);
  const result = match ? match[0] : null;
  console.log('[DEBUG] extractTrackingId result:', result);
  return result;
}

// Utility function to match user input to intents
export function matchIntent(userMessage: string): Intent | null {
  const normalizedMessage = userMessage.toLowerCase().trim();
  
  // PRIORITY 1: Check if message contains a tracking ID (UUID)
  const trackingId = extractTrackingId(userMessage);
  if (trackingId) {
    // Return a special intent for tracking ID detection
    return {
      id: 'tracking_id_detected',
      patterns: [],
      responses: [`🔍 **Tracking ID detectado!**\n\nID: \`${trackingId}\`\n\n📦 Vou buscar informações sobre esta encomenda...`],
      actions: ['fetch_order_details'],
      priority: 100
    };
  }
  
  // PRIORITY 2: Match against defined intents
  // Sort intents by priority (higher priority first)
  const sortedIntents = [...intents].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  for (const intent of sortedIntents) {
    for (const pattern of intent.patterns) {
      if (normalizedMessage.includes(pattern.toLowerCase())) {
        return intent;
      }
    }
  }
  
  return null;
}

// Utility function to get a random response from an intent
export function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}
