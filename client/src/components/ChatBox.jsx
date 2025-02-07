import { useState, useEffect, useRef } from "react";
import { socketManager } from "../services/socket";
import PlayersList from "./helpers/PlayersList";

const ChatBox = ({ players, messages, roomId }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (!trimmedInput) return;
    socketManager.sendMessage(roomId, trimmedInput);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Players list */}
      <div className="p-3 border-b bg-white/90">
        <PlayersList players={players} />
      </div>

      {/* Chat area */}
      <div className="bg-white/90 rounded-lg h-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className="message text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-indigo-600">
                  {msg.user}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-gray-700 break-words">{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form onSubmit={handleSubmit} className="border-t p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your guess..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700"
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
