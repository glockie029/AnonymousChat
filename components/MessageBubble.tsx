import React from 'react';
import { Message, MessageType } from '../types';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.type === MessageType.SYSTEM) {
    return (
      <div className="flex justify-center my-4 animate-fade-in">
        <span className="bg-slate-800/50 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700/50">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 animate-slide-up ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Avatar */}
        <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg`}
            style={{ backgroundColor: message.avatarColor || '#64748b' }}
        >
          {message.username.substring(0, 2).toUpperCase()}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
          <span className="text-[10px] text-slate-400 mb-1 px-1">
            {message.username} • {formatTime(message.timestamp)}
          </span>
          
          <div 
            className={`px-4 py-2 rounded-2xl shadow-md text-sm leading-relaxed break-words relative
              ${isSelf 
                ? 'bg-chat-bubbleSelf text-white rounded-tr-none' 
                : 'bg-chat-bubbleOther text-slate-100 rounded-tl-none'
              }
              ${message.type === MessageType.IMAGE ? 'p-1 bg-transparent border-0 shadow-none' : ''}
            `}
          >
            {message.type === MessageType.IMAGE ? (
               <img 
                 src={message.content} 
                 alt="Shared content" 
                 className="rounded-lg max-h-64 object-cover border border-slate-600 hover:scale-[1.02] transition-transform cursor-pointer"
                 onClick={() => {
                     const w = window.open("");
                     w?.document.write(`<img src="${message.content}" style="width:100%"/>`);
                 }}
               />
            ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
          {message.isStreaming && (
            <span className="text-[10px] text-chat-accent mt-1 animate-pulse">Typing...</span>
          )}
        </div>
      </div>
    </div>
  );
};