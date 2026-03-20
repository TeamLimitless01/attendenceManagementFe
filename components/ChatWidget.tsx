"use client"
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  Bot, 
  User, 
  Maximize2, 
  Minimize2,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      });

      if (!response.ok || !response.body) throw new Error('Stream Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      // Add an empty placeholder for the assistant
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setIsTyping(false); // Stop loader as we start receiving text

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const message = line.replace(/^data: /, '').trim();
          if (message === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: 'assistant', 
                  content: assistantContent 
                };
                return updated;
              });
            }
          } catch (e) {
            // Ignore partial/invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I'm having trouble streaming right now. AMS is always improving, let's try that again later!"
      }]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] w-16 h-16 bg-blue-600 text-white rounded-[2rem] shadow-[0_12px_40px_-8px_rgba(37,99,235,0.4)] flex items-center justify-center border border-blue-400/20 active:scale-95 transition-all"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <div className="relative">
          <MessageCircle className="w-8 h-8" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-blue-600" 
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[70] bg-white rounded-[2.5rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden flex flex-col ${isExpanded ? 'w-[calc(100vw-48px)] h-[calc(100vh-120px)] max-w-4xl max-h-[800px]' : 'w-[400px] h-[600px] max-h-[80vh]'} transition-all duration-500`}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h3 className="font-black text-xl tracking-tight leading-none group flex items-center gap-2">
                     AMS Assistant <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                   </h3>
                   <div className="flex items-center gap-1.5 mt-2">
                     <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Your Personal Guide</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsExpanded(!isExpanded)}
                   className="p-2.5 rounded-xl hover:bg-white/10 transition-colors hidden sm:block"
                 >
                   {isExpanded ? <Minimize2 className="w-5 h-5 text-blue-100" /> : <Maximize2 className="w-5 h-5 text-blue-100" />}
                 </button>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                 >
                   <ChevronDown className="w-6 h-6 text-blue-100" />
                 </button>
              </div>
            </div>

            {/* Chat Body */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="p-5 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100/50">
                    <Sparkles className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800 tracking-tight">How can AMS help you today?</h4>
                    <p className="text-slate-500 font-medium text-sm mt-2 max-w-[240px] mx-auto">
                      Ask me anything about facial recognition, geo-tracking, or managing your institution.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full mt-4">
                     {[
                       "Explain how Face ID works",
                       "How to set up geo-fencing?",
                       "Register a new studentId",
                       "Show attendance analytics"
                     ].map((suggestion) => (
                       <button
                         key={suggestion}
                         onClick={() => setInput(suggestion)}
                         className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all text-left shadow-sm"
                       >
                         {suggestion}
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                       <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[85%] p-4 rounded-[2rem] text-sm font-medium leading-relaxed ${
                    message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-lg shadow-xl shadow-blue-600/10' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-lg shadow-sm'
                  }`}>
                    {message.role === 'assistant' ? (
                       <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => <span className="font-black text-blue-700">{children}</span>,
                            code: ({ children }) => <code className="px-1.5 py-0.5 bg-slate-100 text-blue-600 rounded-md font-bold text-[12px]">{children}</code>,
                          }}
                       >
                         {message.content}
                       </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === 'user' && (
                     <div className="w-8 h-8 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 border border-white">
                        <User className="w-4 h-4" />
                     </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                       <Bot className="w-4 h-4" />
                    </div>
                   <div className="bg-white px-4 py-3 rounded-[2rem] rounded-bl-lg border border-slate-100 shadow-sm flex items-center gap-1.5">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-6 bg-white border-t border-slate-100">
               <div className="relative group">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask AMS Assistant..."
                    className="w-full h-14 pl-6 pr-14 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600/50 transition-all group-hover:bg-slate-100"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-500/20"
                  >
                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
               </div>
               <div className="mt-3 text-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Sarvam AI Neural Core Engagement Active</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
