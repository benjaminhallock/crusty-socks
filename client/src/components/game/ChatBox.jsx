import { useState, useEffect, useRef } from 'react';
import React from 'react';

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
    <div id="chatBox" className="flex flex-col h-full">
      <PlayersList players={players} />
      <div className="flex-1 bg-white/95 rounded-lg mt-2 flex flex-col">
        <div className="h-[62vh] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {localMessages.map((msg, i) => (
              <div
                  key={i}
                  className={`message p-1 rounded ${
                      msg.username === username
                          ? 'bg-indigo-50 ml-4'
                          : 'bg-gray-50 mr-4'
                  }`}
              >
                <span className="font-semibold text-indigo-600">{msg.username}</span>
                <p className="text-xs text-gray-700 break-words">{msg.message}</p>
              </div>
          ))}
          <div ref={messagesEndRef}/>
        </div>

        <form onSubmit={handleSubmit} className="border-t p-2">
          <div className="flex gap-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-2 py-1 text-xs border rounded-lg bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50"
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
  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Deduplicate players by username
  const uniquePlayers = Array.from(new Map(players.map(player => [player.username, player])).values());
  
  return (
    <div className="bg-gray-100 rounded-lg p-2 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Players</h3>
        <button 
          onClick={handleInviteLink} 
          className="bg-indigo-600 text-white px-2 py-1 rounded-lg"
        >
          Invite Link
        </button>
      </div>
      <ul className="space-y-1">
        {uniquePlayers.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            className="flex items-center gap-2 bg-gray-200 p-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                player.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-800 font-medium text-sm">{player.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatBox;
