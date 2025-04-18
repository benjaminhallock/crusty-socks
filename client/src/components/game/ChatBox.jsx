import { useState, useEffect, useRef } from "react";
import { GAME_STATE } from "../../constants";
import { socketManager } from "../../services/socketManager";
import ReportModal from "./menus/ReportModal";

const ChatBox = ({
  user,
  roomId,
  lobbyId,
  lobbyObjectId,
  gameState,
  currentWord,
  currentDrawer,
}) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainer = useRef(null);
  const seenMessages = useRef(new Set());
  const mountedRef = useRef(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Enhanced scroll handling
  const scrollToBottom = () => {
    if (!messageContainer.current || !shouldAutoScroll) return;

    const { scrollHeight, clientHeight, scrollTop } = messageContainer.current;
    const newIsNearBottom = scrollHeight - clientHeight <= scrollTop + 100;

    // Only auto-scroll if we were already near bottom or this is a user's own message
    if (
      newIsNearBottom ||
      messages[messages.length - 1]?.username === user.username
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    setIsNearBottom(newIsNearBottom);
  };

  // Handle scroll events to determine auto-scroll behavior
  const handleScroll = () => {
    if (!messageContainer.current) return;

    const { scrollHeight, clientHeight, scrollTop } = messageContainer.current;
    const newIsNearBottom = scrollHeight - clientHeight <= scrollTop + 100;

    setShouldAutoScroll(newIsNearBottom);
    setIsNearBottom(newIsNearBottom);
  };

  // Add scroll event listener
  useEffect(() => {
    const container = messageContainer.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Add auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up socket listeners with proper cleanup and reconnection handling
  useEffect(() => {
    if (!lobbyObjectId || !socketManager.isConnected()) {
      console.log("ChatBox: Waiting for lobby ID and socket connection");
      return;
    }

    console.log("ChatBox: Initializing with lobby ID:", lobbyObjectId);

    const cleanupMessage = socketManager.onMessage((message) => {
      // Only check for duplicates if the message has an ID
      if (message._id && seenMessages.current.has(message._id)) {
        console.warn("Skipping duplicate message:", message._id);
        return;
      }

      // For messages with IDs, add them to seen messages
      if (message._id) {
        seenMessages.current.add(message._id);
      }

      setMessages((prev) => [...prev, message]);
    });

    const cleanupHistory = socketManager.onChatHistory((history) => {
      console.log("Received chat history, length:", history?.length);
      if (Array.isArray(history)) {
        seenMessages.current.clear();
        // Only track messages with IDs
        history.forEach((msg) => msg._id && seenMessages.current.add(msg._id));
        setMessages(history);
      }
    });

    // Handle reconnection events
    const cleanupStatus = socketManager.onStatusChange((status) => {
      if (status === "connected" && lobbyObjectId) {
        socketManager.requestChatHistory(lobbyObjectId);
      }
    });

    return () => {
      cleanupMessage();
      cleanupHistory();
      cleanupStatus();
      seenMessages.current.clear();
    };
  }, [lobbyObjectId]); // We only need to watch for lobbyObjectId changes

  // Simplify the submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = input.trim();

    // Validate message
    if (!trimmedMessage) {
      setError("Message cannot be empty");
      return;
    }
    if (trimmedMessage.length > 200) {
      setError("Message cannot exceed 200 characters");
      return;
    }

    // Validate connection and IDs
    if (!socketManager.isConnected()) {
      setError("Disconnected from server. Please wait...");
      return;
    }
    if (!roomId) {
      setError("Room ID is missing");
      return;
    }
    if (!lobbyId) {
      setError("Lobby ID is missing");
      return;
    }
    if (!user?.username) {
      setError("User not authenticated");
      return;
    }

    try {
      // Handle drawing state
      if (gameState === GAME_STATE.DRAWING) {
        if (user.username === currentDrawer) {
          setError("You cannot speak while drawing");
          return;
        }
        socketManager.checkWordGuess(roomId, trimmedMessage, user.username);
      } else {
        socketManager.sendMessage(lobbyObjectId, trimmedMessage, user.username);
      }
      setInput("");
      setError("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setError(error.message || "Failed to send message");
    }
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    if (message.username !== user.username && !message.isSystemMessage) {
      setSelectedMessage(message);
      setShowReportModal(true);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedMessage(null);
  };

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-600">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="text-sm px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full">
              {messages.length}
            </span>
          )}
        </h3>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 mt-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg transform transition-all duration-300 animate-in fade-in slide-in-from-top">
          <strong className="font-medium">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Messages Container - Update styling for better scrolling */}
      <div
        ref={messageContainer}
        className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[calc(100vh-20rem)] scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        onScroll={handleScroll}
      >
        <div className="space-y-2">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`group flex flex-col transition-all duration-200 ${
                msg.username === user.username ? "items-end" : "items-start"
              }`}
              onContextMenu={(e) => handleMessageContextMenu(e, msg)}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] p-3 rounded-2xl shadow-sm
                  ${
                    msg.isSystemMessage
                      ? msg.isGuessMessage
                        ? msg.isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50"
                          : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                        : "bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                      : msg.username === user.username
                      ? "bg-indigo-500 dark:bg-indigo-600"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }
                  ${
                    msg.username === user.username
                      ? "rounded-br-sm"
                      : "rounded-bl-sm"
                  }
                `}
              >
                <div
                  className={`${
                    msg.isSystemMessage
                      ? msg.isGuessMessage
                        ? msg.isCorrect
                          ? "text-emerald-700 dark:text-emerald-300 font-medium"
                          : "text-red-700 dark:text-red-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 italic"
                      : msg.username === user.username
                      ? "text-white"
                      : "text-gray-800 dark:text-gray-200"
                  } ${msg.isSystemMessage ? "text-center" : ""}`}
                >
                  {msg.isSystemMessage ? (
                    msg.message
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-medium ${
                            msg.username === user.username
                              ? "text-indigo-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {msg.username === user.username
                            ? "You"
                            : msg.username}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="break-words">{msg.message}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {!isNearBottom && messages.length > 0 && (
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="fixed bottom-20 right-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-2 shadow-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
      >
        <div className="flex gap-2 p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 
              text-gray-800 dark:text-gray-200 
              placeholder-gray-500 dark:placeholder-gray-400
              border border-gray-200 dark:border-gray-600
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all duration-200"
            placeholder={
              gameState === GAME_STATE.DRAWING &&
              user.username !== currentDrawer
                ? "Guess the word..."
                : "Type a message..."
            }
            disabled={gameState === GAME_STATE.FINISHED}
          />
          <button
            type="submit"
            disabled={!input.trim() || gameState === GAME_STATE.FINISHED}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 
              text-white font-medium rounded-xl
              shadow-sm hover:shadow
              transform hover:translate-y-[-1px]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            Send
          </button>
        </div>
      </form>

      {/* Report Modal */}
      {showReportModal && selectedMessage && (
        <ReportModal
          isOpen={showReportModal}
          onClose={handleCloseReportModal}
          reportedUser={selectedMessage.username}
          reportType="message"
          contextData={{
            messageId: selectedMessage._id,
            message: selectedMessage.message,
            timestamp: selectedMessage.timestamp,
          }}
          lobbyId={lobbyObjectId}
        />
      )}
    </div>
  );
};

export default ChatBox;
