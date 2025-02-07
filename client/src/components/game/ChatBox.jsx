import { useState, useEffect, useRef } from 'react';

import { socketManager } from '../../services/socket';

const ChatBox = ({ players, messages = [], roomId, username }) => {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const cleanup = socketManager.onMessage((message) => {
      setLocalMessages(prev => [...prev, message]);
    });
    return () => cleanup();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      socketManager.sendMessage(roomId, trimmedInput, username);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PlayersList players={players} />
      <div className="flex-1 bg-white/95 rounded-lg mt-4 flex flex-col">
        <div className="h-[450px] overflow-y-auto p-4 space-y-2">
          {localMessages.map((msg, i) => (
            <div 
              key={i} 
              className={`message p-2 rounded ${
                msg.username === username 
                  ? 'bg-indigo-50 ml-8' 
                  : 'bg-gray-50 mr-8'
              }`}
            >
              <span className="font-semibold text-indigo-600">{msg.username}</span>
              <p className="text-sm text-gray-700 break-words">{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PlayersList = ({ players }) => {
  // Deduplicate players by username
  const uniquePlayers = Array.from(new Map(players.map(player => [player.username, player])).values());
  
  return (
    <div className="bg-gray-100 rounded-lg p-4 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Players</h3>
      <ul className="space-y-3">
        {uniquePlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            className="flex items-center gap-3 bg-gray-200 p-3 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <span 
              className={`w-3 h-3 rounded-full ${
                player.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-800 font-medium">{player.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatBox;
