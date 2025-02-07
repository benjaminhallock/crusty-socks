import PlayersList from "./helpers/PlayersList";
import { useState, useEffect, useRef } from 'react';
import { socketManager } from '../services/socket';

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
              className="flex-1 px-3 py-2 text-sm border rounded-lg"
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

export default ChatBox;
