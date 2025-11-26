import React, { useState, useEffect, useRef } from 'react';
import { User, Message, MessageType } from '../types';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { geminiService } from '../services/geminiService';

interface ChatRoomProps {
  user: User;
  onLogout: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'system-1',
      userId: 'system',
      username: 'System',
      content: `Welcome to the anonymous room, ${user.username}. Chat history is saved locally in this session.`,
      type: MessageType.SYSTEM,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if ((!text.trim() && !imageBase64)) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      content: imageBase64 || text,
      type: imageBase64 ? MessageType.IMAGE : MessageType.TEXT,
      timestamp: Date.now(),
      avatarColor: user.avatarColor,
    };

    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setInputText('');
    setShowEmoji(false);

    // AI Response Simulation (Mock Backend)
    // We only trigger AI if it's a text message or image, not system.
    // In a real app, this would just push to WebSocket. Here we trigger Gemini.
    await triggerAIResponse(updatedHistory, text, imageBase64);
  };

  const triggerAIResponse = async (history: Message[], userText: string, imageBase64?: string) => {
    setIsAiProcessing(true);
    
    // Create a placeholder message for AI
    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      userId: 'gemini-bot',
      username: 'GeminiBot',
      content: '',
      type: MessageType.TEXT,
      timestamp: Date.now(),
      avatarColor: '#8b5cf6', // Violet
      isStreaming: true
    };

    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const stream = await geminiService.sendMessageStream(history, userText, imageBase64);
      
      let accumulatedText = "";

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, content: accumulatedText } 
            : msg
        ));
      }

      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, isStreaming: false } 
          : msg
      ));

    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
            ? { ...msg, content: "Error processing response.", isStreaming: false } 
            : msg
        ));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple constraint for demo
    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleSendMessage("", base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chat_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg relative">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-chat-bg/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="font-bold text-lg tracking-tight">Anon<span className="text-chat-accent">Room</span></h2>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={exportChat}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-colors border border-slate-700"
            >
                Save Log
            </button>
            <button 
                onClick={onLogout}
                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-md transition-colors border border-red-500/20"
            >
                Leave
            </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isSelf={msg.userId === user.id} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-chat-sidebar/50 backdrop-blur">
        <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageUpload}
          />

          {/* Tools */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-all border border-slate-700 mb-0.5"
            title="Upload Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>

          <button 
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 transition-all border border-slate-700 mb-0.5"
            title="Add Emoji"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>

          {showEmoji && (
            <EmojiPicker 
                onSelect={(emoji) => {
                    setInputText(prev => prev + emoji);
                    setShowEmoji(false);
                }} 
                onClose={() => setShowEmoji(false)}
            />
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(inputText);
                    }
                }}
                placeholder="Type a message..."
                className="w-full bg-slate-900 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chat-accent/50 border border-slate-700 resize-none h-12 max-h-32 custom-scrollbar"
                rows={1}
            />
          </div>

          {/* Send Button */}
          <button 
            onClick={() => handleSendMessage(inputText)}
            disabled={(!inputText.trim() && !isAiProcessing)}
            className="p-3 rounded-xl bg-chat-accent text-white hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-lg shadow-violet-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-2">
            Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};