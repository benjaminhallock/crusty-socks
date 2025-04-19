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
  const [isChatFocused, setIsChatFocused] = useState(false);
  const inputRef = useRef(null);

  // Enhanced scroll handling with focus awareness
  const scrollToBottom = (force = false) => {
    if (!messageContainer.current) return;

    const { scrollHeight, clientHeight, scrollTop } = messageContainer.current;
    const newIsNearBottom = scrollHeight - clientHeight <= scrollTop + 100;

    // Only auto-scroll if:
    // 1. Force scroll is requested, or
    // 2. Chat is focused and we're near bottom, or
    // 3. This is the user's own message and we're focused
    if (
      force ||
      (isChatFocused && newIsNearBottom) ||
      (messages[messages.length - 1]?.username === user.username &&
        isChatFocused)
    ) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }

    setIsNearBottom(newIsNearBottom);
  };

  // Update scroll behavior based on new messages
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // Focus management handlers
  const handleChatFocus = () => {
    setIsChatFocused(true);
    scrollToBottom(true);
  };

  const handleChatBlur = () => {
    setIsChatFocused(false);
  };

  // Handle scroll events to determine auto-scroll behavior
  const handleScroll = () => {
    if (!messageContainer.current) return;

    const { scrollHeight, clientHeight, scrollTop } = messageContainer.current;
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
    const newIsNearBottom = distanceFromBottom < 100;

    setShouldAutoScroll(newIsNearBottom);
    setIsNearBottom(newIsNearBottom);
  };

  // Update the scroll effect to use shouldAutoScroll
  useEffect(() => {
    if (
      shouldAutoScroll ||
      messages[messages.length - 1]?.username === user.username
    ) {
      scrollToBottom(false);
    }
  }, [messages, shouldAutoScroll, user.username]);

  // Add scroll event listener
  useEffect(() => {
    const container = messageContainer.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

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
        if (
          user.username === currentDrawer &&
          currentWord.includes(trimmedMessage)
        ) {
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
    <div
      className="w-full flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-600"
      onFocus={handleChatFocus}
      onBlur={handleChatBlur}
    >
      {/* Header */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full">
              {messages.length}
            </span>
          )}
        </h3>
      </div>

      {/* Messages Container */}
      <div className="relative flex-1">
        <div
          ref={messageContainer}
          className="overflow-y-auto p-2 space-y-1 max-h-[calc(100vh-20rem)] scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent h-full"
        >
          <div className="space-y-1">
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`group flex flex-col transition-all duration-200 ${
                  msg.username === user.username ? "items-end" : "items-start"
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                onContextMenu={(e) => handleMessageContextMenu(e, msg)}
              >
                <div
                  className={`max-w-[90%] p-2 rounded-xl text-sm shadow-sm hover:shadow-md transition-all duration-200
                    transform hover:translate-y-[-1px]
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
        </div>

        {/* New Messages Indicator */}
        {!isNearBottom && messages.length > 0 && !isChatFocused && (
          <div className="absolute bottom-2 right-2 z-10">
            <button
              onClick={() => scrollToBottom(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-full shadow-lg 
                hover:bg-indigo-700 transition-all duration-200
                flex items-center gap-2 group hover:translate-y-[-1px]"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>New messages</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-auto"
      >
        <div className="flex gap-1 p-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => scrollToBottom(true)}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 
                text-gray-800 dark:text-gray-200 
                placeholder-gray-500 dark:placeholder-gray-400
                border border-gray-200 dark:border-gray-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={
              gameState === GAME_STATE.DRAWING &&
              user.username !== currentDrawer
                ? "Guess..."
                : "Message..."
            }
            disabled={gameState === GAME_STATE.FINISHED}
          />
          <button
            type="submit"
            disabled={!input.trim() || gameState === GAME_STATE.FINISHED}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                text-white text-sm font-medium rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
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
