import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

const ChatbotPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi! I am the ReClaim.io assistant ♻️\nHow can I help you with your recycling today?', isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // NOTE: Update "https://localhost:7111" to whatever port your backend is actually running on!
      const response = await fetch('http://localhost:5150/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      
      const data = await response.json();
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: data.reply || "Sorry, I didn't understand that.", 
        isBot: true 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: "Sorry, I'm having trouble connecting to our servers right now. Please check if the backend is running.", 
        isBot: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* The Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 sm:w-96 flex flex-col overflow-hidden mb-4 transition-all duration-300" style={{ height: '500px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-xl">♻️</span> ReClaim Support
            </h3>
            <button onClick={toggleChat} className="text-white hover:text-green-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.isBot ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' : 'bg-green-600 text-white rounded-tr-none'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 text-gray-500 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                  <p className="text-sm flex items-center gap-1 font-bold tracking-widest">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about ReClaim.io..."
                className="flex-1 p-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm px-4"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !inputText.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 flex items-center justify-center border-4 border-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatbotPopup;