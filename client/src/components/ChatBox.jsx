import { useState, useEffect } from "react";
import { socket } from "../services/socket";
import PlayersList from "./helpers/PlayersList";

const ChatBox = ({ players, messages: initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState("");

  const inputStyle =
    "flex-1 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const buttonStyle =
    "bg-indigo-600 text-white px-3 py-1 text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700";

  useEffect(() => {
    const handleMessage = (message) =>
      setMessages((prev) => [...prev, message]);
    socket.on("chatMessage", handleMessage);
    return () => socket.off("chatMessage", handleMessage);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const user = localStorage.getItem("user");
    socket.emit("guess", { user: user._id, message: trimmedInput });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <PlayersList players={players} />
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className="message text-sm">
              <span className="font-bold text-indigo-600">{msg.user}: </span>
              <span className="text-gray-700">{msg.message}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your guess..."
              className={inputStyle}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={buttonStyle}
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
