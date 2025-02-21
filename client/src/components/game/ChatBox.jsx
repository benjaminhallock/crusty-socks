import React from "react";
import { useState, useEffect, useRef } from "react";
import LobbySettings from "../lobby/LobbySettings";
import { socketManager } from "../../services/socket";

// ChatBox component handles real-time messaging in game rooms
const ChatBox = ({ user, roomId, messages }) => {  
  // State management for chat functionality
  const [input, setInput] = useState(""); // Stores current message input
  const [localMessages, setLocalMessages] = useState(messages); // Local copy of messages
  const [error, setError] = useState(null); // Error handling state
  const messagesEndRef = useRef(null); // Reference for auto-scrolling

  // Helper function to auto-scroll to bottom of chat
  const scrollToBottom = () => {
    console.log('Scrolling chat to bottom');
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Main useEffect for socket connection and message handling
  useEffect(() => {
    console.log('Setting up chat socket connection for room:', roomId);
    let mounted = true;
    
    if (mounted) {
      console.log('Initializing local messages:', messages);
      setLocalMessages(messages);
    }

    let cleanup;
    try {
      // Subscribe to new messages
      cleanup = socketManager.onMessage((message) => {
        console.log('New message received:', message);
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
  }, [roomId, user]);

  // Auto-scroll effect when new messages arrive
  useEffect(() => {
    console.log('Messages updated, scrolling to bottom');
    scrollToBottom();
  }, [localMessages]);

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      console.log('Sending message:', trimmedInput);
      socketManager.sendMessage(roomId, trimmedInput, user.username);
      setInput("");
    }
  };

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="text-red-500 p-4">{error}</div>;
  }

  // Main chat UI render
  return (
    <div id="chatBox" className="flex flex-col h-full">
      {/* Chat messages container */}
      <div className="flex-1 bg-white/95 rounded-lg mt-2 flex flex-col">
        <div className="h-[78vh] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {localMessages.map((msg, i) => (
            <div
              key={i}
              className={`message p-1 rounded ${
                msg.username === user.username
                  ? "bg-indigo-50 ml-4" // Current user's messages
                  : "bg-gray-50 mr-4"   // Other users' messages
              }`}
            >
              <span className="font-semibold text-indigo-600">
                {msg.username}
              </span>
              <p className="text-xs text-gray-700 break-words">{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Auto-scroll anchor */}
        </div>

        {/* Message input form */}
        <form onSubmit={handleSubmit} className="border-t p-2">
          <div className="flex gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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

export default ChatBox;