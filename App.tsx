import React, { useState } from 'react';
import { ChatRoom } from './components/ChatRoom';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');

  const generateRandomColor = () => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setUser({
      id: Date.now().toString(),
      username: usernameInput.trim(),
      avatarColor: generateRandomColor(),
    });
  };

  const handleLogout = () => {
    setUser(null);
    setUsernameInput('');
  };

  if (user) {
    return <ChatRoom user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-chat-bg text-slate-100 p-4">
      <div className="w-full max-w-md bg-chat-sidebar p-8 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            AnonChat
          </h1>
          <p className="text-slate-400 text-sm mt-2">Enter a username to join the anonymous session.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chat-accent/50 focus:border-transparent transition-all"
              placeholder="e.g. GhostRider"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={!usernameInput.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-violet-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            Start Chatting
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
             <p className="text-xs text-slate-500">
                Messages are stored locally during the session. <br/>
                Includes AI participant <span className="text-slate-300">Gemini Bot</span>.
             </p>
        </div>
      </div>
    </div>
  );
}

export default App;