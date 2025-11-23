import React, { useState, useEffect, useRef } from 'react';
import { matchIntent, getRandomResponse, fallbackResponses, welcomeMessage, extractTrackingId } from '../utils/chatbotKnowledgeBase';
import { fetchOrderByTrackingId, formatOrderDetails } from '../utils/orderApi';
import './ChatAssistant.css';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatAssistantProps {
  onToggleOrderHistory?: () => void;
  authToken?: string;
  customerId?: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onToggleOrderHistory, authToken, customerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addAssistantMessage(welcomeMessage);
      }, 500);
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const addMessage = (text: string, sender: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAssistantMessage = (text: string) => {
    setIsTyping(true);
    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'assistant');
    }, 800);
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    // Add user message
    addMessage(trimmedInput, 'user');
    setInputValue('');

    console.log('[DEBUG] handleSendMessage - trimmedInput:', trimmedInput);

    // PRIORITY 1: Check if message contains tracking ID
    const trackingId = extractTrackingId(trimmedInput);
    console.log('[DEBUG] handleSendMessage - trackingId:', trackingId);
    if (trackingId) {
      setIsTyping(true);
      
      try {
        // Fetch order details from API
        const order = await fetchOrderByTrackingId(trackingId, authToken, customerId);
        
        setIsTyping(false);
        
        if (order) {
          // Format and display order details
          const formattedDetails = formatOrderDetails(order);
          addMessage(formattedDetails, 'assistant');
        } else {
          // Order not found
          addMessage(
            `❌ **Tracking ID não encontrado**\n\nO ID \`${trackingId}\` não foi encontrado no sistema.\n\n💡 **Dicas:**\n• Verifique se copiou o ID completo\n• Certifique-se de que o pedido foi criado\n• Entre em contacto com o suporte se o problema persistir`,
            'assistant'
          );
        }
      } catch (error) {
        setIsTyping(false);
        addMessage(
          `⚠️ **Erro ao buscar encomenda**\n\nOcorreu um erro ao tentar buscar informações da encomenda.\n\n🔄 Tente novamente ou contacte o suporte: suporte@slms.pt`,
          'assistant'
        );
      }
      return;
    }

    // PRIORITY 2: Process intent and respond
    const intent = matchIntent(trimmedInput);
    
    if (intent) {
      const response = getRandomResponse(intent.responses);
      addAssistantMessage(response);

      // Handle special actions
      if (intent.actions?.includes('toggle_order_history') && onToggleOrderHistory) {
        setTimeout(() => {
          onToggleOrderHistory();
        }, 1000);
      }
    } else {
      // Fallback response
      const fallbackResponse = getRandomResponse(fallbackResponses);
      addAssistantMessage(fallbackResponse);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-assistant-container">
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">
                <i className="bi bi-robot"></i>
              </div>
              <div className="chat-header-text">
                <h6 className="mb-0">Assistente SLMS</h6>
                <small className="text-white-50">Sempre disponível</small>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={toggleChat}
              aria-label="Fechar chat"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                {message.sender === 'assistant' && (
                  <div className="message-avatar">
                    <i className="bi bi-robot"></i>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-bubble">
                    {message.text.split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        {idx < message.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-message assistant-message">
                <div className="message-avatar">
                  <i className="bi bi-robot"></i>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
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
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Escreva sua mensagem..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={500}
            />
            <button
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              aria-label="Enviar mensagem"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`chat-fab ${isOpen ? 'chat-fab-open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
      >
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
        {!isOpen && messages.length === 0 && (
          <span className="chat-fab-badge">
            <i className="bi bi-stars"></i>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;
