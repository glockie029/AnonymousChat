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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiProcessing, pendingImage]);

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

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !pendingImage)) return;

    const currentText = inputText;
    const currentImage = pendingImage;

    // Clear input state immediately for UX responsiveness
    setInputText('');
    setPendingImage(null);
    setShowEmoji(false);

    // 1. Send Image Message if exists
    if (currentImage) {
      const imgMsg: Message = {
        id: Date.now().toString() + '-img',
        userId: user.id,
        username: user.username,
        content: currentImage,
        type: MessageType.IMAGE,
        timestamp: Date.now(),
        avatarColor: user.avatarColor,
      };
      setMessages(prev => [...prev, imgMsg]);
    }

    // 2. Send Text Message if exists
    if (currentText.trim()) {
      const textMsg: Message = {
        id: Date.now().toString() + '-txt',
        userId: user.id,
        username: user.username,
        content: currentText,
        type: MessageType.TEXT,
        timestamp: Date.now() + 1, // Ensure order
        avatarColor: user.avatarColor,
      };
      setMessages(prev => [...prev, textMsg]);
    }

    // AI Response Simulation
    // Pass the combined context. If both exist, we treat it as a multimodal request.
    const updatedHistory = [...messages]; 
    // Note: We don't strictly need to append the new messages to 'updatedHistory' variable 
    // for the API call immediately if we rely on the session, but for good measure:
    
    await triggerAIResponse(updatedHistory, currentText, currentImage || undefined);
  };

  const triggerAIResponse = async (history: Message[], userText: string, imageBase64?: string) => {
    setIsAiProcessing(true);
    
    // Create a placeholder message for AI
    const aiMsgId = (Date.now() + 100).toString();
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Focus text input
    inputRef.current?.focus();
  };

  const clearPendingImage = () => {
    setPendingImage(null);
  };

  const exportChat = () => {
    const exportData = {
      roomName: "AnonChat Session",
      exportedAt: new Date().toISOString(),
      messages: messages
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `anon_chat_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg relative">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-chat-bg/95 backdrop-blur z-10 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight leading-none text-slate-100">Anon<span className="text-chat-accent">Room</span></h2>
              <span className="text-[10px] text-slate-500 font-mono">ID: {user.username}</span>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={exportChat}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Save
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
            >
                Leave
            </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative custom-scrollbar">
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
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          {/* Image Preview Banner */}
          {pendingImage && (
            <div className="flex items-start gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 animate-slide-up">
              <div className="relative group">
                <img src={pendingImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-lg transition-all">
                   {/* Overlay effect */}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center h-16">
                <span className="text-xs font-semibold text-slate-300">Image attached</span>
                <span className="text-[10px] text-slate-500">Ready to send</span>
              </div>
              <button 
                onClick={clearPendingImage}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 relative">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageSelect}
            />

            {/* Tools */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-all border mb-0.5 ${
                  pendingImage 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700 border-slate-700'
              }`}
              title="Upload Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>

            <button 
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-3 rounded-xl transition-all border mb-0.5 ${
                  showEmoji 
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 border-slate-700'
              }`}
              title="Add Emoji"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>

            {showEmoji && (
              <EmojiPicker 
                  onSelect={(emoji) => {
                      setInputText(prev => prev + emoji);
                      setShowEmoji(false);
                      inputRef.current?.focus();
                  }} 
                  onClose={() => setShowEmoji(false)}
              />
            )}

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                      }
                  }}
                  placeholder={pendingImage ? "Add a caption..." : "Type a message..."}
                  className="w-full bg-slate-900 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chat-accent/50 border border-slate-700 resize-none h-12 max-h-32 custom-scrollbar shadow-inner"
                  rows={1}
              />
            </div>

            {/* Send Button */}
            <button 
              onClick={() => handleSendMessage()}
              disabled={(!inputText.trim() && !pendingImage) || isAiProcessing}
              className="p-3 rounded-xl bg-chat-accent text-white hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-lg shadow-violet-900/20 group"
            >
              {isAiProcessing ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                 <svg className="group-active:translate-x-0.5 group-active:-translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </div>
          
          <div className="flex justify-between px-1">
             <p className="text-[10px] text-slate-500">
                AI Participant active • Images supported
             </p>
             <p className="text-[10px] text-slate-500">
                Enter to send
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};