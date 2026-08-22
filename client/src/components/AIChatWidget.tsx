import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Greetings. I am the JalDrishti AI Assistant. How can I help you analyze the groundwater telemetry today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
      const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
      
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply || 'No response from AI.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Error connecting to the AI core. Check backend server connection.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990]">
      {/* Chat Window */}
      <div 
        className={`bg-slate-900 border border-slate-700 w-80 sm:w-96 shadow-2xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 h-[420px] mb-4 pointer-events-auto' : 'scale-0 opacity-0 h-0 m-0 pointer-events-none'
        }`}
      >
        <div className="bg-cyan-950 border-b border-slate-700 p-3 flex justify-between items-center shadow-sm">
          <span className="font-bold text-sm text-cyan-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            JalDrishti AI Assistant
          </span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-950/60 text-xs">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2.5 rounded-lg leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-cyan-700 text-white rounded-br-none shadow-sm' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 text-slate-400 p-2.5 rounded-lg rounded-bl-none text-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-2.5 border-t border-slate-800 bg-slate-950 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stations, critical states..." 
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-cyan-600 hover:bg-cyan-500 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer ml-auto border border-cyan-400/40"
        title="Open JalDrishti AI Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </button>
    </div>
  );
};
