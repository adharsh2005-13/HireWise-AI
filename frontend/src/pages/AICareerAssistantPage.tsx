import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ChatMessage } from '../types';
import { Bot, Send, User, Sparkles, BookOpen, AlertCircle, Info } from 'lucide-react';

export const AICareerAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "How can I improve my resume for Senior Full-Stack Engineer roles?",
    "What are the most common technical questions asked in FastAPI & React interviews?",
    "How do I structure behavioral answers using the STAR method?",
    "What is the difference between optimistic and pessimistic locking in databases?"
  ];

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChat = async () => {
    try {
      const history = await api.getChatHistory();
      if (history.messages && history.messages.length > 0) {
        setMessages(history.messages);
        setSessionId(history.active_session_id);
      } else {
        // Welcome message
        setMessages([{
          sender: 'ai',
          message: "Hello! I am your HireWise AI Career Assistant. I can help optimize your resume, prepare you for technical interviews, analyze skill gaps, and explore engineering roadmaps. What would you like to discuss today?",
          is_fallback: true
        }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { sender: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAI(text, sessionId);
      setSessionId(res.session_id);
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: res.reply,
        sources: res.sources,
        is_fallback: res.is_fallback
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: 'Sorry, I encountered an issue processing your request. Please try again.',
        is_fallback: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bot size={28} color="#3b82f6" /> AI Career & Interview Advisor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Grounded in verified platform guidelines and job description standards
          </p>
        </div>
        <span className="badge badge-blue">
          <Sparkles size={12} /> RAG-Augmented
        </span>
      </div>

      {/* Messages Scrollable Area */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1rem',
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: isUser ? 'var(--primary)' : 'rgba(99, 102, 241, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isUser ? <User size={18} /> : <Bot size={18} color="#818cf8" />}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: '80%',
                  background: isUser ? 'var(--primary)' : 'var(--bg-surface)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  borderTopRightRadius: isUser ? '4px' : 'var(--radius-lg)',
                  borderTopLeftRadius: isUser ? 'var(--radius-lg)' : '4px',
                  lineHeight: 1.6,
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ whiteSpace: 'pre-line' }}>{msg.message}</div>

                {/* Sources & Fallback tags for AI responses */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-primary)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <BookOpen size={12} /> RETRIEVED SOURCES:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {msg.sources.map((s, idx) => (
                        <span key={idx} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {s.title} ({s.source_type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!isUser && msg.is_fallback && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Info size={11} /> Running in deterministic career advisor mode
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#818cf8" />
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Retrieving approved knowledge & generating answer...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        <input
          type="text"
          className="input-field"
          style={{ padding: '0.85rem 1.25rem', fontSize: '0.95rem' }}
          placeholder="Ask anything about resume bullets, system design, mock interview questions, or roadmaps..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '0 1.5rem', gap: '0.5rem' }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
