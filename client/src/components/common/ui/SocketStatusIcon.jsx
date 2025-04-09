import React from "react";

/**
 * Socket Status Icon Component
 * Displays the connection status with color-coded indicators:
 * - Green: Connected
 * - Orange: Connecting/Reconnecting
 * - Red: Disconnected/Error
 */
const SocketStatusIcon = ({ status }) => {
  // Define colors for different states
  const getColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
      case "reconnecting":
        return "bg-orange-500";
      case "disconnected":
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center" title={`Socket status: ${status}`}>
      <div
        className={`w-3 h-3 ${getColor()} rounded-full mr-2 animate-pulse ${
          status === "connected" ? "animate-none" : ""
        }`}
      ></div>
      <span className="text-xs text-gray-600 dark:text-gray-300">{status}</span>
    </div>
  );
};

export default SocketStatusIcon;
