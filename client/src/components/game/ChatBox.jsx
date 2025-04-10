import { useState, useEffect, useRef } from "react";
import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";

const ChatBox = ({ user, roomId, lobbyObjectId, gameState, currentWord, currentDrawer }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const messageContainer = useRef(null);
  const seenMessages = useRef(new Set());

  // Improved scroll handling
  const scrollToBottom = () => {
    if (messageContainer.current) {
      const { scrollHeight, clientHeight, scrollTop } = messageContainer.current;
      const isScrolledToBottom = scrollHeight - clientHeight <= scrollTop + 100;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Improved message handling to prevent duplicates
  const handleNewMessage = (message) => {
    console.log('ChatBox received message:', { 
      id: message?._id,
      username: message?.username,
      seen: seenMessages.current.has(message?._id)
    });
    
    if (!message?._id) {
      console.log('Skipping message without _id');
      return;
    }
    
    if (seenMessages.current.has(message._id)) {
      console.log('Skipping duplicate message:', message._id);
      return;
    }

    seenMessages.current.add(message._id);
    setMessages(prev => [...prev, message]);
  };

  // Set up socket listeners with proper cleanup
  useEffect(() => {
    if (!socketManager.isConnected() || !lobbyObjectId) {
      console.log('Socket not connected or missing lobbyObjectId');
      return;
    }

    console.log('Setting up chat listeners for lobby:', lobbyObjectId);
    socketManager.requestChatHistory(lobbyObjectId);

    const cleanupMessage = socketManager.onMessage(handleNewMessage);
    const cleanupHistory = socketManager.onChatHistory((history) => {
      console.log('Received chat history, length:', history?.length);
      if (Array.isArray(history)) {
        // Clear seen messages when loading history
        seenMessages.current.clear();
        // Add all history message IDs to seen set
        history.forEach(msg => msg._id && seenMessages.current.add(msg._id));
        setMessages(history);
      }
    });

    return () => {
      console.log('Cleaning up chat listeners');
      cleanupMessage();
      cleanupHistory();
      seenMessages.current.clear();
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

  // Update the messages div to be properly scrollable
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Chat</h3>
      </div>

      <div 
        ref={messageContainer}
        className="flex-1 overflow-y-auto p-3 max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
      >
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
