import React from 'react';

const COMMON_EMOJIS = [
  "😀", "😂", "🤣", "😉", "😊", "😍", "🤩", "🤔", "😐", "😑",
  "😶", "🙄", "😥", "😮", "😴", "🤮", "🥳", "😎", "😭", "😱",
  "👍", "👎", "👋", "👏", "🙏", "💪", "🧠", "🔥", "✨", "🎉",
  "❤️", "💔", "💯", "✅", "❌", "⚠️", "💩", "👻", "🤖", "👽"
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div className="absolute bottom-16 left-4 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-64 p-3 animate-fade-in">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Select Emoji</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">Close</button>
        </div>
      <div className="grid grid-cols-5 gap-2 h-48 overflow-y-auto custom-scrollbar">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="text-xl hover:bg-slate-700 p-1 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};