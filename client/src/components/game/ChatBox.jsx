import { useState, useEffect, useRef } from "react";
import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";

const ChatBox = ({ user, roomId, lobbyObjectId, gameState, currentWord, currentDrawer }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up socket listeners with proper cleanup
  useEffect(() => {
    if (!socketManager.isConnected() || !lobbyObjectId) return;

    // Request chat history once when component mounts
    socketManager.requestChatHistory(lobbyObjectId);

    // Create a stable reference to the handler functions
    const handleNewMessage = (message) => {
      setMessages(prev => {
        // Prevent duplicate messages by checking ID
        if (message._id && prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleChatHistory = (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    };

    // Set up listeners with stable references
    const cleanupMessage = socketManager.onMessage(handleNewMessage);
    const cleanupHistory = socketManager.onChatHistory(handleChatHistory);

    return () => {
      cleanupMessage();
      cleanupHistory();
    };
  }, [lobbyObjectId]); // Only depend on lobbyObjectId

  // Simplify the submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = input.trim();
    
    // Enhanced validation
    if (!trimmedMessage || !user?.username || !lobbyObjectId) {
      console.error("Missing required data:", {
        message: trimmedMessage,
        username: user?.username,
        lobbyObjectId
      });
      return;
    }

    try {
      // Send message and wait for server to broadcast it back
      socketManager.sendMessage(lobbyObjectId, trimmedMessage, user.username);
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`p-2 rounded-lg ${
                msg.isSystemMessage 
                  ? "bg-gray-100 dark:bg-gray-800"
                  : msg.username === user.username
                  ? "bg-indigo-100 dark:bg-indigo-900 text-right"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <p className={`${
                msg.isSystemMessage 
                  ? "text-gray-600 dark:text-gray-400 italic"
                  : msg.username === user.username
                  ? "text-indigo-700 dark:text-indigo-200"
                  : "text-gray-700 dark:text-gray-300"
              }`}>
                {msg.isSystemMessage ? (
                  msg.message
                ) : (
                  <>
                    <span className="font-semibold">
                      {msg.username === user.username ? "You" : msg.username}:
                    </span>{" "}
                    {msg.message}
                  </>
                )}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t dark:border-gray-600">
        <div className="flex gap-2 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={gameState === GAME_STATE.DRAWING && user.username !== currentDrawer ? "Guess the word..." : "Type a message..."}
            disabled={gameState === GAME_STATE.FINISHED}
          />
          <button
            type="submit"
            disabled={!input.trim() || gameState === GAME_STATE.FINISHED}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
