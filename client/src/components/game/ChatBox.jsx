import React from 'react';
import { useState, useEffect, useRef } from 'react';

import LobbySettings from '../lobby/LobbySettings';
import { socketManager } from '../../services/socket';

const ChatBox = ({ user, roomId, messages, players }) => {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      setLocalMessages(messages);
    }
    
    let cleanup;
    try {
      // Ensure socket is connected
      if (!socketManager.isConnected()) {
        socketManager.connect();
      }
      
      cleanup = socketManager.onMessage((message) => {
        setLocalMessages(prev => [...prev, message]);
      });
      
      setError(null);
    } catch (err) {
      setError("Failed to connect to chat");
      console.error("Socket connection error:", err);
    }

    return () => cleanup && cleanup();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      socketManager.sendMessage(roomId, trimmedInput, user.username);
      setInput("");
    }
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div id="chatBox" className="flex flex-col h-full">
      {/* <PlayersList players={players} /> */}
      <div className="flex-1 bg-white/95 rounded-lg mt-2 flex flex-col">
        <div className="h-[78vh] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {localMessages.map((msg, i) => (
              <div
                  key={i}
                  className={`message p-1 rounded ${
                      msg.username === user.username
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

  const onStartGame = () => {
    if (players.length < 2) {
      alert("Need at least 2 players to start the game.");
      return;
    }

    socketManager.startGame();
  };

  // Deduplicate players by username
  const uniquePlayers = Array.from(new Map(players.map(player => [player.username, player])).values());
  
  return (
    <div className="bg-gray-100 rounded-lg p-2 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Players</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleInviteLink} 
            className="bg-indigo-600 text-white px-2 py-1 rounded-lg"
          >
            Invite
          </button>
          <button 
            onClick={onStartGame}
            className="bg-gray-600 text-white px-2 py-1 rounded-lg"
          >
            Start
          </button>
        </div>
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
