import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';
import { HfInference } from '@huggingface/inference';
import { useISSData } from '../hooks/useISSData';
import { useNewsData } from '../hooks/useNewsData';
import toast from 'react-hot-toast';

const CHAT_STORAGE_KEY = 'chat_history_v2';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Get live data to feed into the prompt context
  const { position, speed, locationName, astros } = useISSData();
  const { news } = useNewsData();

  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    } else {
      setMessages([
        { role: 'assistant', content: 'Hello! I am your dashboard assistant. I can answer questions about the ISS and the latest news displayed here.' }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const clearChat = () => {
    const initial = [{ role: 'assistant', content: 'Chat history cleared. How can I help you today?' }];
    setMessages(initial);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial));
    toast.success('Chat cleared');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];

    // Keep last 30 messages
    if (newMessages.length > 30) {
      newMessages.splice(1, newMessages.length - 30);
    }

    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_AI_TOKEN;
      if (!apiKey || apiKey === 'your_huggingface_KEY') {
        throw new Error('Missing Hugging Face API Token (VITE_AI_TOKEN)');
      }

      // Construct context
      const context = `
CURRENT DASHBOARD DATA:
- ISS Location: ${locationName} (Lat: ${position?.lat || 0}, Lon: ${position?.lon || 0})
- ISS Speed: ${speed?.toFixed(2) || 0} km/h
- People in space right now: ${astros?.number || 0} (${astros?.people.map(p => p.name).join(', ')})
- Latest News Headlines:
${news.slice(0, 5).map((n, i) => `${i + 1}. ${n.title} (Source: ${n.source})`).join('\n')}
`;

      const hf = new HfInference(apiKey);

      const systemMessage = {
        role: "system",
        content: `You are an AI assistant integrated into a space and news dashboard.
Your ONLY source of truth is the CURRENT DASHBOARD DATA provided below. 
You must NEVER use outside knowledge. Do NOT guess. 
If the user asks something not in the dashboard data, reply: "I can only answer based on the current dashboard data (ISS stats and recent news)."
Be concise and helpful.

${context}`
      };

      // We pass the system message and the last 5 messages to save context window
      const conversationHistory = newMessages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Using Qwen instead of Mistral v0.2 because Mistral v0.2 was removed from HF free inference tier
      const out = await hf.chatCompletion({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [systemMessage, ...conversationHistory],
        max_tokens: 200,
        temperature: 0.1,
      });

      const aiResponse = out.choices[0].message.content.trim();

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to generate response.');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error communicating with the AI. Please check your token or try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all z-50 flex items-center justify-center"
        aria-label="Toggle Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] max-h-[600px] h-[80vh] bg-[hsl(var(--card))]/90 backdrop-blur-xl border border-[hsl(var(--border))]/50 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between shadow-md relative z-10">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold">Orbit AI</h3>
            </div>
            <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded-md transition-colors" title="Clear Chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[hsl(var(--background))]/50 relative z-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-purple-500/10 border border-purple-500/20 text-[hsl(var(--foreground))] rounded-tr-none' : 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] rounded-tl-none border border-[hsl(var(--border))]'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-[hsl(var(--card))] text-[hsl(var(--foreground))] rounded-tl-none border border-[hsl(var(--border))] flex gap-1 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/80 backdrop-blur-md relative z-10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about ISS or News..."
                className="w-full bg-[hsl(var(--muted))] border-transparent rounded-full pl-4 pr-12 py-3 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full disabled:opacity-50 hover:shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
