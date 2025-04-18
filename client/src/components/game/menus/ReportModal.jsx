import { useState, useEffect } from "react";
import { createReport } from "../../../services/api";

const REPORT_REASONS = [
  "AFK / Inactive",
  "Abusive Chat",
  "Inappropriate Drawing",
  "Inappropriate Username",
  "Spamming",
  "Other",
];

// ReportModal component allows users to report other players for various reasons
const ReportModal = ({
  onClose,
  reportedUser,
  currentUsername,
  roomId,
  chatLogs = [],
  canvasState = null,
  highlightedMessage = null,
}) => {
  const [selectedReason, setSelectedReason] = useState(""); // State to track the selected reason for reporting
  const [additionalComments, setAdditionalComments] = useState(""); // State to store additional comments
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track submission status
  const [error, setError] = useState(""); // State to store error messages
  const [success, setSuccess] = useState(false); // State to track successful submission
  const [includeChatLogs, setIncludeChatLogs] = useState(true); // State to determine if chat logs should be included
  const [includeDrawing, setIncludeDrawing] = useState(true); // State to determine if drawing should be included

  // Handle form submission for reporting a player
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const reportData = {
        reportedUser, // Username of the reported player
        reportedBy: currentUsername, // Username of the reporting player
        roomId, // ID of the game room
        reason: selectedReason, // Selected reason for reporting
        additionalComments, // Additional comments provided by the user
        chatLogs: includeChatLogs ? chatLogs?.slice(-15) || [] : [], // Last 15 chat logs for context
        canvasState:
          includeDrawing && selectedReason === "Inappropriate Drawing"
            ? canvasState
            : null,
      };

      const result = await createReport(reportData);

      if (result.success) {
        setSuccess(true);
        // Close the modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to submit report");
      }
    } catch (err) {
      setError("An error occurred while submitting your report");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview of the drawing if available
  const DrawingPreview = () => {
    if (
      !canvasState?.data ||
      selectedReason !== "Inappropriate Drawing" ||
      !includeDrawing
    ) {
      return null;
    }

    return (
      <div className="mb-4">
        <label className="block text-gray-300 mb-2">Drawing Preview</label>
        <div className="bg-white rounded overflow-hidden">
          <img
            src={canvasState.data}
            alt="Drawing Preview"
            className="w-full h-auto"
            style={{ maxHeight: "200px" }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/95 p-6 rounded-lg max-w-md w-full border border-gray-700 shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl text-white font-bold mb-4">Report Player</h2>

        {success ? (
          <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded mb-4 text-center">
            Report submitted successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <p className="text-white mb-2">
                Reporting:{" "}
                <span className="font-bold text-indigo-400">
                  {reportedUser}
                </span>
              </p>
            </div>

            {/* Highlighted message if reporting from chat */}
            {highlightedMessage && (
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">
                  Reported Message:
                </label>
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  {highlightedMessage.map((msg, i) => (
                    <div key={i} className="text-gray-300">
                      <span className="text-indigo-400">{msg.username}: </span>
                      {msg.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Select a reason *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center">
                    <input
                      type="radio"
                      id={`reason-${reason}`}
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`reason-${reason}`}
                      className="text-white cursor-pointer"
                    >
                      {reason}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence collection options */}
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Evidence to Include
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeChatLogs"
                    checked={includeChatLogs}
                    onChange={() => setIncludeChatLogs(!includeChatLogs)}
                    className="mr-2"
                  />
                  <label
                    htmlFor="includeChatLogs"
                    className="text-white cursor-pointer"
                  >
                    Include recent chat messages
                  </label>
                </div>

                {selectedReason === "Inappropriate Drawing" &&
                  canvasState?.data && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeDrawing"
                        checked={includeDrawing}
                        onChange={() => setIncludeDrawing(!includeDrawing)}
                        className="mr-2"
                      />
                      <label
                        htmlFor="includeDrawing"
                        className="text-white cursor-pointer"
                      >
                        Include drawing snapshot
                      </label>
                    </div>
                  )}
              </div>
            </div>

            {/* Drawing preview */}
            <DrawingPreview />

            {/* Chat log preview */}
            {includeChatLogs && chatLogs.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">
                  Recent Chat Messages
                </label>
                <div className="bg-gray-700 rounded p-3 max-h-32 overflow-y-auto">
                  {chatLogs.slice(-10).map((message, index) => (
                    <div key={index} className="text-sm mb-1">
                      <span className="text-indigo-400">
                        {message.username}:{" "}
                      </span>
                      <span className="text-gray-300">{message.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-300 mb-2">
                Additional comments
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded"
                rows="3"
                placeholder="Provide more details about the issue..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
