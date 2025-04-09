import { useState, useEffect, useRef } from "react";

import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";

const ChatBox = ({ user, roomId, lobbyObjectId, gameState, currentWord, currentDrawer }) => {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const lastDrawerRef = useRef(null);
  const chatInitializedRef = useRef(false);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // First useEffect to set up socket listeners
  useEffect(() => {
    if (!socketManager.isConnected() || !lobbyObjectId) return;

    const handleMessage = (message) => {
      // Filter out duplicate messages by ID
      setLocalMessages((prev) => {
        if (message._id && prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleGameState = (data) => {
      if (data.lobby && data.lobby.currentDrawer) {
        // Only add system message when drawer actually changes
        if (data.lobby.gameState === GAME_STATE.DRAWING && 
            data.lobby.currentDrawer !== lastDrawerRef.current) {
          
          lastDrawerRef.current = data.lobby.currentDrawer;
          
          // Different messages for drawer and guessers
          if (data.lobby.currentDrawer === user.username) {
            const sysMsg = {
              _id: `sys-draw-${Date.now()}`,
              username: "Server",
              message: `You are drawing: ${data.lobby.currentWord}`,
              timestamp: Date.now(),
              isSystemMessage: true,
            };
            setLocalMessages(prev => [...prev, sysMsg]);
          } else {
            const sysMsg = {
              _id: `sys-drawer-${Date.now()}`,
              username: "Server",
              message: `${data.lobby.currentDrawer} is now drawing!`,
              timestamp: Date.now(),
              isSystemMessage: true,
            };
            setLocalMessages(prev => [...prev, sysMsg]);
          }
        }
      }
    };

    // Set up cleanup functions for event listeners
    const cleanup1 = socketManager.onMessage(handleMessage);
    const cleanup2 = socketManager.onGameStateUpdate(handleGameState);
    
    // Request chat history when component mounts
    if (!chatInitializedRef.current && lobbyObjectId) {
      socketManager.requestChatHistory(lobbyObjectId, user.username);
      chatInitializedRef.current = true;
    }
    
    return () => {
      cleanup1();
      cleanup2();
    };
  }, [lobbyObjectId, user.username]);

  // Separate useEffect for chat history
  useEffect(() => {
    if (!socketManager.isConnected()) return;

    const handleChatHistory = (history) => {
      // Only set messages if we actually received some
      if (Array.isArray(history) && history.length > 0) {
        // Filter out any invalid messages
        const validMessages = history.filter(msg => msg?.message);
        console.log("Received chat history:", validMessages.length, "messages");
        
        // Replace all messages to avoid duplicates
        setLocalMessages(validMessages);
      }
    };

    const cleanup = socketManager.onChatHistory(handleChatHistory);
    
    return () => {
      cleanup();
    };
  }, []);

  // Add this effect to only scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // Helper function to check if message contains the current word
  const containsCurrentWord = (message, word) => {
    if (!word || !message) return false;
    
    const wordParts = word.toLowerCase().split(' ');
    const messageParts = message.toLowerCase().split(' ');
    
    return wordParts.some(part => 
      messageParts.some(msgPart => 
        msgPart.includes(part) || part.includes(msgPart)
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    // Validate if the user is drawing and message contains the current word
    if (gameState === GAME_STATE.DRAWING && 
        user.username === currentDrawer &&
        containsCurrentWord(trimmedInput, currentWord)) {
      // Don't allow hints - this will be handled server-side too
      setInput("");
      return;
    }

    // Handle guesses during drawing phase
    if (gameState === GAME_STATE.DRAWING && user.username !== currentDrawer) {
      const isExactWord = trimmedInput.toLowerCase() === currentWord?.toLowerCase();
      
      // Display the guess locally (server will handle this too)
      const localGuessMsg = {
        _id: Date.now() + "-local-guess",
        username: user.username,
        message: trimmedInput,
        timestamp: Date.now(),
        isLocalOnly: true
      };
      setLocalMessages(prev => [...prev, localGuessMsg]);
      
      // Send to server to check if correct
      socketManager.checkWordGuess(roomId, trimmedInput, user.username);
    } else {
      // Regular chat message
      socketManager.sendMessage(lobbyObjectId, trimmedInput, user.username);
    }
    
    setInput("");
  };

  const formatMessage = (msg, index) => {
    if (!msg?.message) return null;

    // System messages (server notifications)
    if (msg.isSystemMessage || msg.username === "Server") {
      // Correct guess messages
      if (msg.isGuessMessage || msg.message.includes("guessed the word correctly")) {
        return (
          <div key={msg._id || index} className="message p-2 rounded-lg bg-green-100 dark:bg-green-900 my-2">
            <p className="text-green-700 dark:text-green-200 font-semibold">
              {msg.message}
            </p>
          </div>
        );
      }
      
      // Other system messages
      return (
        <div key={msg._id || index} className="message p-2 rounded-lg bg-gray-100 dark:bg-gray-800 my-2">
          <p className="text-gray-600 dark:text-gray-400 italic">{msg.message}</p>
        </div>
      );
    }

    // Don't show messages marked as local only if they're older than 5 seconds
    // This prevents duplicate display when server response comes back
    if (msg.isLocalOnly && Date.now() - msg.timestamp > 5000) {
      return null;
    }

    // Regular user messages
    return (
      <div
        key={msg._id || index}
        className={`message p-2 rounded-lg ${
          msg.username === user.username
            ? "bg-indigo-100 dark:bg-indigo-900 text-right"
            : "bg-gray-100 dark:bg-gray-800"
        } my-2`}
      >
        <p className={`${msg.username === user.username ? "text-indigo-700 dark:text-indigo-200" : "text-gray-700 dark:text-gray-300"}`}>
          <span className="font-semibold">{msg.username === user.username ? "You" : msg.username}:</span>{" "}
          {msg.message}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="p-3 border-b dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Chat</h3>
      </div>

      {/* Chat messages with max height and scrolling */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {localMessages.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center">No messages yet</p>
          ) : (
            localMessages.map((msg, index) => formatMessage(msg, index))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Form with no bottom padding to be flush */}
      <form onSubmit={handleSubmit} className="border-t dark:border-gray-600">
        <div className="flex gap-2 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              gameState === GAME_STATE.DRAWING && user.username !== currentDrawer
                ? "Guess the word..."
                : "Type a message..."
            }
            className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={gameState === GAME_STATE.ROUND_END || gameState === GAME_STATE.FINISHED}
          />
          <button
            type="submit"
            disabled={!input.trim() || gameState === GAME_STATE.ROUND_END || gameState === GAME_STATE.FINISHED}
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
