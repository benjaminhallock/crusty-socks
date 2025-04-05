import { useState, useEffect, useRef } from "react";

import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socket";

// ChatBox component handles real-time messaging in game rooms
const ChatBox = ({ user, roomId, messages, gameState }) => {  
  // State management for chat functionality
  const [input, setInput] = useState(""); // Stores current message input
  const [localMessages, setLocalMessages] = useState(messages); // Local copy of messages
  const [error, setError] = useState(null); // Error handling state
  const messagesEndRef = useRef(null); // Reference for auto-scrolling
  const chatContainerRef = useRef(null); // Reference for the chat container

  // Helper function to auto-scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  // Main useEffect for socket connection and message handling
  useEffect(() => {
    console.log('Setting up chat socket connection for room:', roomId);
    let mounted = true;    
    if (mounted) setLocalMessages(messages);
    
    let cleanup;
    try {
      // Subscribe to new messages
      cleanup = socketManager.onMessage((message) => {
        setLocalMessages((prev) => [...prev, message]);
      });

      setError(null);
    } catch (err) {
      console.error("Socket connection error:", err);
      setError("Failed to connect to chat");
    }

    // Cleanup function for socket connection
    return () => {
      console.log('Cleaning up chat socket connection');
      cleanup && cleanup();    
      mounted = false;
    };
  }, [roomId, user, messages]);

  // Auto-scroll effect when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput) {
      // Send the guess to check first
      if (gameState === GAME_STATE.DRAWING) {
        console.log('Checking word guess:', trimmedInput);
        socketManager.checkWordGuess(roomId, trimmedInput, user.username);
      }
      else 
      // Only send as chat message if it's not the correct word
      // This prevents the word from appearing in chat
      setTimeout(() => {
        socketManager.sendMessage(roomId, trimmedInput, user.username);
      }, 100);
      
      setInput("");
    }
  };

  // Add input validation to prevent typing the word
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    // Don't allow typing any part of the word or similar variations
    const currentWord = socketManager?.currentRoom?.currentWord?.toLowerCase();
    if (currentWord) {
      const cleanInput = newValue.toLowerCase();
      if (currentWord.includes(cleanInput) || cleanInput.includes(currentWord)) {
        return; // Don't update input if it contains the word
      }
    }
    setInput(newValue);
  };

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="text-red-500 p-4">{error}</div>;
  }

  // Render individual chat messages
  const renderMessage = (msg, index) => {
    if (msg.username === "Server") {
      // Handle success message for correct guess
      if (msg.message.includes("guessed the word correctly")) {
        return (
          <div key={index} className="message p-2 rounded-lg bg-green-100 dark:bg-green-900 my-2">
            <p className="text-green-700 dark:text-green-200 font-semibold">{msg.message}</p>
          </div>
        );
      }
      // Handle round end message
      if (msg.message.includes("Round ended")) {
        return (
          <div key={index} className="message p-2 rounded-lg bg-blue-100 dark:bg-blue-900 my-2">
            <p className="text-blue-700 dark:text-blue-200 font-semibold">{msg.message}</p>
          </div>
        );
      }
      // Default server message
      return (
        <div key={index} className="message p-2 rounded-lg bg-gray-100 dark:bg-gray-800 my-2">
          <p className="text-gray-600 dark:text-gray-400 italic">{msg.message}</p>
        </div>
      );
    }

    // Regular user message
    return (
      <div
        key={index}
        className={`message p-2 rounded-lg ${
          msg.username === user.username
            ? "bg-indigo-50 dark:bg-indigo-900/50 ml-4"
            : "bg-gray-50 dark:bg-gray-800 mr-4"
        } my-1`}
      >
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {msg.username}
        </span>
        <p className="text-gray-700 dark:text-gray-300 break-words">{msg.message}</p>
      </div>
    );
  };

  // Main chat UI render
  return (
    <div id="chatBox" className="flex flex-col h-full">
      {/* Chat messages container */}
      <div className="flex-1 bg-white/95 mt-2 dark:bg-gray-700/85 flex flex-col justify-between transition-colors">
        <div 
          ref={chatContainerRef} 
          className="h-[calc(78vh-44px)] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
        >
          {localMessages.map((msg, i) => renderMessage(msg, i))}
          <div ref={messagesEndRef} className="h-0" /> {/* Invisible marker for scroll position */}
        </div>

        {/* Message input form */}
        <div className="sticky bottom-0 w-full bg-white/95 dark:bg-gray-700/95 border-t dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 px-2 py-1 text-xs border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50 hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;