import { useState, useRef, useEffect } from "react";
import { socketManager } from "../services/socket";
import PlayersList from "./helpers/PlayersList";

const ChatBox = ({ players, messages, roomId }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput) {
      socketManager.sendMessage(roomId, trimmedInput);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PlayersList players={players} />

      <div className="flex-1 bg-white/90 rounded-lg mt-4 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => (
            <div 
              key={msg.timestamp ? `msg-${msg.timestamp}-${i}` : `msg-${Date.now()}-${i}`} 
              className="message"
            >
              <span className="font-semibold text-indigo-600">{msg.user}</span>
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
              maxLength={200}
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
