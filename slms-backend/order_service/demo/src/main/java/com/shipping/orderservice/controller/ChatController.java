package com.shipping.orderservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * ChatController - Handles chat assistant requests with RAG (Retrieval-Augmented Generation)
 * 
 * This controller provides endpoints for the conversational AI assistant integrated
 * into the SLMS customer portal. It uses context injection from the knowledge base
 * to provide accurate, domain-specific responses.
 * 
 * Note: In production, this should call external AI services (OpenAI, Anthropic, etc.)
 * For now, it provides mock responses based on RAG context.
 * 
 * @author SLMS Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Map<String, List<ChatMessage>> conversationHistory = new ConcurrentHashMap<>();

    // UUID pattern for tracking ID detection
    private static final Pattern UUID_PATTERN = Pattern.compile(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
    );

    /**
     * Data class for chat messages
     */
    public static class ChatMessage {
        private String id;
        private String role; // "user" | "assistant" | "system"
        private String content;
        private long timestamp;
        private Map<String, Object> metadata;

        public ChatMessage() {
            this.id = UUID.randomUUID().toString();
            this.timestamp = System.currentTimeMillis();
        }

        public ChatMessage(String role, String content) {
            this();
            this.role = role;
            this.content = content;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * Request DTO for chat completion
     */
    public static class ChatCompletionRequest {
        private List<ChatMessage> messages;
        private String sessionId;
        private Map<String, Object> context; // User context (role, userId, etc.)

        // Getters and Setters
        public List<ChatMessage> getMessages() { return messages; }
        public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
        
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        
        public Map<String, Object> getContext() { return context; }
        public void setContext(Map<String, Object> context) { this.context = context; }
    }

    /**
     * POST /api/chat - Chat completion endpoint
     * 
     * Receives a user message and returns an AI-generated response using RAG context.
     * 
     * In production, this should:
     * 1. Extract user message from request
     * 2. Retrieve relevant context from knowledge base (RAG)
     * 3. Build system prompt with injected context
     * 4. Call OpenAI/Anthropic API with system + user messages
     * 5. Stream response back to client
     * 
     * Current implementation: Mock responses with RAG context simulation
     */
    @PostMapping
    public ResponseEntity<ChatMessage> chatCompletion(@RequestBody ChatCompletionRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Get the last user message
        ChatMessage lastMessage = request.getMessages().get(request.getMessages().size() - 1);
        String userMessage = lastMessage.getContent().toLowerCase();

        // Store conversation history
        String sessionId = request.getSessionId() != null ? request.getSessionId() : "default";
        conversationHistory.putIfAbsent(sessionId, new ArrayList<>());
        conversationHistory.get(sessionId).addAll(request.getMessages());

        // Generate response based on RAG context (mock implementation)
        String responseContent = generateRAGResponse(userMessage, request.getContext());

        ChatMessage assistantMessage = new ChatMessage("assistant", responseContent);
        conversationHistory.get(sessionId).add(assistantMessage);

        return ResponseEntity.ok(assistantMessage);
    }

    /**
     * POST /api/chat/stream - Streaming chat completion (SSE)
     * 
     * For real-time streaming responses compatible with @assistant-ui/react
     */
    @PostMapping("/stream")
    public SseEmitter chatStream(@RequestBody ChatCompletionRequest request) {
        SseEmitter emitter = new SseEmitter(30000L); // 30 second timeout

        executor.execute(() -> {
            try {
                if (request.getMessages() == null || request.getMessages().isEmpty()) {
                    emitter.completeWithError(new IllegalArgumentException("No messages provided"));
                    return;
                }

                ChatMessage lastMessage = request.getMessages().get(request.getMessages().size() - 1);
                String userMessage = lastMessage.getContent().toLowerCase();
                String response = generateRAGResponse(userMessage, request.getContext());

                // Simulate streaming by sending response in chunks
                String[] words = response.split(" ");
                StringBuilder currentChunk = new StringBuilder();

                for (int i = 0; i < words.length; i++) {
                    currentChunk.append(words[i]).append(" ");
                    
                    // Send chunk every 3 words or at the end
                    if ((i + 1) % 3 == 0 || i == words.length - 1) {
                        Map<String, Object> data = new HashMap<>();
                        data.put("type", "text-delta");
                        data.put("textDelta", currentChunk.toString());
                        
                        emitter.send(SseEmitter.event()
                            .data(data)
                            .name("message"));
                        
                        currentChunk = new StringBuilder();
                        Thread.sleep(100); // Simulate network delay
                    }
                }

                // Send completion event
                Map<String, Object> finishData = new HashMap<>();
                finishData.put("type", "finish");
                finishData.put("finishReason", "stop");
                
                emitter.send(SseEmitter.event()
                    .data(finishData)
                    .name("message"));

                emitter.complete();

            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * GET /api/chat/history/{sessionId} - Get conversation history
     */
    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String sessionId) {
        List<ChatMessage> history = conversationHistory.getOrDefault(sessionId, new ArrayList<>());
        return ResponseEntity.ok(history);
    }

    /**
     * DELETE /api/chat/history/{sessionId} - Clear conversation history
     */
    @DeleteMapping("/history/{sessionId}")
    public ResponseEntity<Void> clearHistory(@PathVariable String sessionId) {
        conversationHistory.remove(sessionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Generates RAG-enhanced response based on user message
     * 
     * This is a mock implementation. In production, replace with:
     * - Vector database search (Pinecone, Weaviate, ChromaDB)
     * - OpenAI embeddings for semantic search
     * - LangChain for RAG orchestration
     * - GPT-4/Claude for response generation
     */
    private String generateRAGResponse(String userMessage, Map<String, Object> context) {
        String response;
        String lowerMessage = userMessage.toLowerCase().trim();

        // PRIORITY 1: Extract tracking ID (UUID) from message - check this FIRST
        Matcher uuidMatcher = UUID_PATTERN.matcher(userMessage);
        String trackingId = null;
        if (uuidMatcher.find()) {
            trackingId = uuidMatcher.group();
        }

        // If tracking ID found anywhere in message, fetch order details immediately
        if (trackingId != null) {
            return getOrderDetails(trackingId, context);
        }

        // PRIORITY 2: Check if message is ONLY a potential UUID (even if malformed)
        // This catches cases where user just pastes an ID
        if (lowerMessage.matches("^[a-f0-9-]{20,}$")) {
            return "🔍 **Tracking ID detectado!**\n\n" +
                   "Parece que você enviou um ID, mas não consegui validá-lo.\n\n" +
                   "✅ **Formato correto**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`\n" +
                   "❌ **Seu ID**: `" + userMessage + "`\n\n" +
                   "Por favor, verifique e envie novamente! Se copiou da lista de encomendas, certifique-se de copiar o ID completo.";
        }

        // PRIORITY 3: Keyword-based RAG context retrieval
        if (lowerMessage.contains("rastreio") || lowerMessage.contains("rastrear") || lowerMessage.contains("tracking") || 
            lowerMessage.contains("onde está") || lowerMessage.contains("onde esta")) {
            response = "📦 **Rastreamento de Encomendas**\n\n" +
                      "Para rastrear sua encomenda:\n" +
                      "1️⃣ Me envie o **Tracking ID** (você recebeu por email)\n" +
                      "2️⃣ Posso buscar informações em tempo real sobre:\n" +
                      "   • Status atual da encomenda\n" +
                      "   • Localização e transportadora\n" +
                      "   • Origem e destino\n" +
                      "   • Histórico de movimentações\n\n" +
                      "💡 **Exemplo**: Cole aqui algo como:\n" +
                      "`a1b2c3d4-e5f6-7890-abcd-ef1234567890`\n\n" +
                      "Você também pode clicar em \"📋 Histórico\" abaixo para ver todas as suas encomendas!";
        
        } else if (lowerMessage.contains("status") || lowerMessage.contains("estado")) {
            response = "📊 **Status das Encomendas**\n\n" +
                      "Para verificar o status de uma encomenda específica, me envie o **Tracking ID**!\n\n" +
                      "Nosso sistema tem os seguintes status:\n\n" +
                      "🟡 **Pendente** - Aguardando atribuição (1-2h)\n" +
                      "🟢 **Atribuído** - Transportadora designada (2-6h)\n" +
                      "🚚 **Em Trânsito** - Encomenda em rota de entrega\n" +
                      "✅ **Entregue** - Entrega confirmada com POD\n" +
                      "❌ **Cancelado/Failed** - Verificar detalhes\n\n" +
                      "Cole o Tracking ID aqui para consultar! 🔍";
        
        } else if (userMessage.contains("pod") || userMessage.contains("proof") || userMessage.contains("comprovação")) {
            response = "📸 **Proof of Delivery (POD)**\n\n" +
                      "POD é a comprovação digital da entrega:\n" +
                      "✓ Foto da encomenda entregue OU assinatura digital\n" +
                      "✓ Capturado pelo driver no momento da entrega\n" +
                      "✓ Disponível nos detalhes da encomenda após conclusão\n\n" +
                      "🔒 Garantia de segurança e comprovação legal!\n\n" +
                      "Para ver o POD de uma encomenda, me envie o Tracking ID!";
        
        } else if (userMessage.contains("histórico") || userMessage.contains("pedidos") || userMessage.contains("encomendas anteriores")) {
            response = "📋 **Histórico de Encomendas**\n\n" +
                      "Para ver suas encomendas:\n" +
                      "1️⃣ Clique no botão \"📋 Histórico\" abaixo\n" +
                      "2️⃣ Filtre por status, data ou transportadora\n" +
                      "3️⃣ Clique em qualquer encomenda para ver detalhes completos\n\n" +
                      "💾 Pode baixar documentos como packing slip e shipping label!\n\n" +
                      "Ou me envie um Tracking ID específico para consultar!";
        
        } else if (userMessage.contains("criar") || userMessage.contains("nova encomenda") || userMessage.contains("como enviar")) {
            response = "📦 **Criar Nova Encomenda**\n\n" +
                      "Passos para criar encomenda:\n" +
                      "1️⃣ Clique em \"Nova Encomenda\" na sua página\n" +
                      "2️⃣ Preencha:\n" +
                      "   • Endereço de origem\n" +
                      "   • Endereço de destino\n" +
                      "   • Peso da encomenda\n" +
                      "3️⃣ Sistema atribui automaticamente a melhor transportadora\n" +
                      "4️⃣ Receberá Tracking ID por email\n\n" +
                      "⚡ Processo rápido e automatizado!";
        
        } else if (userMessage.contains("tempo") || userMessage.contains("demora") || userMessage.contains("quanto tempo")) {
            response = "⏱️ **Prazos de Entrega**\n\n" +
                      "Estimativas gerais:\n" +
                      "🏠 **Local**: 1-2 dias\n" +
                      "🇵🇹 **Nacional**: 3-5 dias\n" +
                      "🌍 **Internacional**: 7-15 dias\n\n" +
                      "📌 Para ETA específico, me envie o Tracking ID da sua encomenda!\n" +
                      "💡 Você receberá notificações automáticas em cada etapa.";
        
        } else if (userMessage.contains("problema") || userMessage.contains("erro") || userMessage.contains("falha")) {
            response = "⚠️ **Resolução de Problemas**\n\n" +
                      "Se houver problemas com a entrega:\n" +
                      "1️⃣ Me envie o **Tracking ID** para investigar\n" +
                      "2️⃣ Verifico o status e histórico da encomenda\n" +
                      "3️⃣ Forneço informações da transportadora para contato\n" +
                      "4️⃣ Nossa equipe de suporte está sempre disponível\n\n" +
                      "🔄 Sistema permite reagendamento automático em alguns casos!\n\n" +
                      "Cole o Tracking ID aqui para começarmos a investigação! 🔍";
        
        } else if (userMessage.contains("ajuda") || userMessage.contains("help") || userMessage.contains("o que pode fazer")) {
            response = "🤖 **Como posso ajudar?**\n\n" +
                      "Posso auxiliar com:\n" +
                      "🔍 **Rastrear encomendas** - Me envie o Tracking ID (UUID)\n" +
                      "📦 Ver status, origem, destino e transportadora\n" +
                      "📋 Informações sobre histórico de pedidos\n" +
                      "🚚 Detalhes sobre status de entrega\n" +
                      "📸 Explicar Proof of Delivery (POD)\n" +
                      "⏱️ Prazos e estimativas\n" +
                      "❓ Processo de criação de encomendas\n" +
                      "⚠️ Resolução de problemas\n\n" +
                      "💡 **Dica**: Cole aqui o Tracking ID de qualquer encomenda para consultar informações detalhadas em tempo real!\n\n" +
                      "O que gostaria de saber? 😊";
        
        } else if (userMessage.contains("olá") || userMessage.contains("oi") || userMessage.contains("bom dia")) {
            String userName = context != null && context.containsKey("userName") 
                ? (String) context.get("userName") 
                : "Customer";
            response = "👋 Olá, " + userName + "!\n\n" +
                      "Bem-vindo ao assistente virtual do **SLMS** (Smart Logistics Management System)!\n\n" +
                      "🔍 **Novidade**: Agora consigo rastrear encomendas em tempo real!\n" +
                      "Basta enviar o Tracking ID e verifico todos os detalhes para você!\n\n" +
                      "Também posso ajudar com:\n" +
                      "• 📦 Informações sobre rastreamento\n" +
                      "• 📋 Histórico de pedidos\n" +
                      "• 🚚 Status de entregas\n" +
                      "• ❓ Dúvidas gerais\n\n" +
                      "Como posso ajudar hoje? 😊";
        
        } else if (lowerMessage.contains("obrigado") || lowerMessage.contains("thanks") || lowerMessage.contains("obrigada")) {
            response = "😊 De nada! Fico feliz em ajudar!\n\n" +
                      "Se precisar rastrear alguma encomenda ou tiver mais dúvidas, é só me enviar o Tracking ID ou fazer outra pergunta! 🚚✨";
        
        } else {
            // Fallback response - assume user might want to track
            response = "🤔 Hmm, não compreendi bem.\n\n" +
                      "💡 **Quer rastrear uma encomenda?**\n" +
                      "→ Cole aqui o **Tracking ID** (encontra-se nos detalhes do pedido)\n" +
                      "→ Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`\n\n" +
                      "📋 **Ver histórico?**\n" +
                      "→ Clique no botão \"Histórico\" abaixo\n\n" +
                      "❓ **Outras dúvidas?**\n" +
                      "→ Digite \"ajuda\" para ver tudo que posso fazer!\n\n" +
                      "O que gostaria de saber? 😊";
        }

        return response;
    }

    /**
     * Fetches order details from database by tracking ID
     */
    private String getOrderDetails(String trackingId, Map<String, Object> context) {
        try {
            String sql = "SELECT \"id\", \"tracking_id\", \"status\", \"origin\", \"destination\", " +
                        "\"weight\", \"carrier_id\", \"customer_id\", \"created_at\", \"updated_at\", " +
                        "\"estimated_delivery\", \"actual_delivery\" " +
                        "FROM \"Orders\" WHERE \"tracking_id\" = ?";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, trackingId);
            
            if (results.isEmpty()) {
                return "❌ **Tracking ID não encontrado**\n\n" +
                       "Não consegui encontrar nenhuma encomenda com o Tracking ID:\n" +
                       "`" + trackingId + "`\n\n" +
                       "Por favor verifique:\n" +
                       "✓ Se copiou o ID completo\n" +
                       "✓ Se o ID está correto (confira no email de confirmação)\n" +
                       "✓ Se a encomenda foi criada no sistema\n\n" +
                       "💡 Pode ver todas as suas encomendas clicando em \"📋 Histórico\" abaixo!";
            }
            
            Map<String, Object> order = results.get(0);
            
            // Build detailed response
            StringBuilder response = new StringBuilder();
            response.append("📦 **Detalhes da Encomenda**\n\n");
            response.append("🆔 **Tracking ID**: `").append(trackingId).append("`\n\n");
            
            // Status with emoji
            String status = (String) order.get("status");
            String statusEmoji = getStatusEmoji(status);
            response.append("📊 **Status**: ").append(statusEmoji).append(" **").append(status).append("**\n\n");
            
            // Origin and Destination
            response.append("📍 **Origem**: ").append(order.get("origin")).append("\n");
            response.append("📍 **Destino**: ").append(order.get("destination")).append("\n\n");
            
            // Weight
            response.append("⚖️ **Peso**: ").append(order.get("weight")).append(" kg\n\n");
            
            // Carrier
            Object carrierId = order.get("carrier_id");
            if (carrierId != null) {
                String carrierName = getCarrierName(carrierId.toString());
                response.append("🚚 **Transportadora**: ").append(carrierName).append("\n\n");
            } else {
                response.append("🚚 **Transportadora**: Aguardando atribuição\n\n");
            }
            
            // Dates
            response.append("📅 **Criada em**: ").append(formatDate(order.get("created_at"))).append("\n");
            
            Object estimatedDelivery = order.get("estimated_delivery");
            if (estimatedDelivery != null) {
                response.append("⏰ **Entrega estimada**: ").append(formatDate(estimatedDelivery)).append("\n");
            }
            
            Object actualDelivery = order.get("actual_delivery");
            if (actualDelivery != null) {
                response.append("✅ **Entregue em**: ").append(formatDate(actualDelivery)).append("\n");
            }
            
            response.append("\n");
            
            // Status-specific advice
            response.append(getStatusAdvice(status));
            
            response.append("\n💡 **Dica**: Pode ver mais detalhes e documentos (POD, labels) no seu histórico de encomendas!");
            
            return response.toString();
            
        } catch (Exception e) {
            System.err.println("Error fetching order details: " + e.getMessage());
            e.printStackTrace();
            return "❌ **Erro ao buscar encomenda**\n\n" +
                   "Desculpe, ocorreu um erro ao procurar a encomenda com o Tracking ID:\n" +
                   "`" + trackingId + "`\n\n" +
                   "Por favor tente novamente ou contacte o suporte.\n\n" +
                   "Erro técnico: " + e.getMessage();
        }
    }
    
    /**
     * Get emoji for order status
     */
    private String getStatusEmoji(String status) {
        if (status == null) return "❓";
        
        switch (status.toLowerCase()) {
            case "pendente":
            case "pending":
                return "🟡";
            case "atribuído":
            case "assigned":
                return "🟢";
            case "em trânsito":
            case "in_transit":
            case "in transit":
                return "🚚";
            case "entregue":
            case "delivered":
                return "✅";
            case "cancelado":
            case "cancelled":
            case "failed":
                return "❌";
            default:
                return "📦";
        }
    }
    
    /**
     * Get carrier name from ID
     */
    private String getCarrierName(String carrierId) {
        try {
            String sql = "SELECT \"name\" FROM \"Carriers\" WHERE \"id\" = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, UUID.fromString(carrierId));
            
            if (!results.isEmpty()) {
                return (String) results.get(0).get("name");
            }
        } catch (Exception e) {
            System.err.println("Error fetching carrier name: " + e.getMessage());
        }
        
        return "ID: " + carrierId;
    }
    
    /**
     * Format date object
     */
    private String formatDate(Object dateObj) {
        if (dateObj == null) return "N/A";
        return dateObj.toString();
    }
    
    /**
     * Get advice based on order status
     */
    private String getStatusAdvice(String status) {
        if (status == null) return "";
        
        switch (status.toLowerCase()) {
            case "pendente":
            case "pending":
                return "⏳ **Próximo passo**: Aguardando atribuição de transportadora (normalmente 1-2h)";
            
            case "atribuído":
            case "assigned":
                return "📋 **Próximo passo**: Transportadora está a preparar a recolha (2-6h)";
            
            case "em trânsito":
            case "in_transit":
            case "in transit":
                return "🚚 **Em movimento**: A encomenda está a caminho do destino!\n" +
                       "Receberá notificação quando estiver próxima da entrega.";
            
            case "entregue":
            case "delivered":
                return "✅ **Concluído**: Encomenda entregue com sucesso!\n" +
                       "POD (Proof of Delivery) disponível nos detalhes.";
            
            case "cancelado":
            case "cancelled":
            case "failed":
                return "❌ **Atenção**: Encomenda cancelada ou com falha.\n" +
                       "Contacte o suporte para mais informações.";
            
            default:
                return "";
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "ChatController");
        status.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(status);
    }
}
