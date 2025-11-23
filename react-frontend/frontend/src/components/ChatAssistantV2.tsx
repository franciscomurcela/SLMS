/**
 * ChatAssistantV2 Component - AI-powered conversational interface with RAG
 * 
 * Simple chatbot implementation using custom components and backend RAG integration.
 * 
 * Features:
 * - Custom chat UI with message bubbles
 * - RAG context injection for domain-specific knowledge
 * - Real-time responses from backend
 * - Conversation history
 * - Integration with backend /api/chat endpoint
 * 
 * @module ChatAssistantV2
 */

import React, { useState, useRef, useEffect } from 'react';
import './ChatAssistantV2.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantV2Props {
  onToggleOrderHistory?: () => void;
  userContext?: {
    role?: string;
    userId?: string;
    userName?: string;
  };
}

/**
 * ChatAssistantV2 Component
 * 
 * Provides an AI-powered chat interface with RAG backend integration
 */
const ChatAssistantV2: React.FC<ChatAssistantV2Props> = ({ 
  onToggleOrderHistory,
  userContext 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Bem-vindo ao Assistente SLMS!** [VERSÃO ATUALIZADA v2.0]\n\nPosso ajudar com suas encomendas. O que deseja saber?\n\n**Perguntas comuns:**\n• 📦 "Onde está minha encomenda?"\n• 📋 "Ver meu histórico de pedidos"\n• 🚚 "Quando minha entrega chega?"\n• ❓ "Ajuda"\n\n💡 **Dica**: Cole aqui o Tracking ID (UUID) para rastrear em tempo real!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Order service runs on port 8081 (mapped from internal 8080)
      const response = await fetch('http://localhost:8081/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: inputValue
            }
          ],
          context: userContext || {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar a sua pergunta.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar a sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="chat-fab"
        onClick={toggleChat}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        title="Assistente Virtual SLMS"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h4>Assistente SLMS</h4>
                <span className="chat-status">Online</span>
              </div>
            </div>
            <button 
              className="chat-close-btn" 
              onClick={toggleChat}
              aria-label="Fechar chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
              >
                <div className="chat-message-content">
                  {message.content}
                </div>
                <div className="chat-message-time">
                  {message.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-content">
                  <div className="chat-loading">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-container">
            <textarea
              className="chat-input"
              placeholder="Escreva a sua mensagem..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Enviar mensagem"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          {/* Quick Actions Footer */}
          <div className="chat-quick-actions">
            <button 
              className="quick-action-btn"
              onClick={() => {
                if (onToggleOrderHistory) {
                  onToggleOrderHistory();
                }
              }}
              title="Ver Histórico de Encomendas"
            >
              📋 Histórico
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => {
                const container = document.querySelector('.chat-messages');
                if (container) {
                  container.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              title="Voltar ao início"
            >
              ⬆️ Topo
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistantV2;
