import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchUserProfile,
  getUserReports,
  getUserChatHistory,
} from "../../services/api";

const UserDetail = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    reports: true,
    chats: true,
  });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading((prev) => ({ ...prev, profile: true }));

      const result = await fetchUserProfile(username);

      if (result.success) {
        setUser(result.profile);
      } else {
        setError(result.error || "Failed to load user profile");
      }

      setLoading((prev) => ({ ...prev, profile: false }));
    };

    fetchUserData();
  }, [username]);

  // Fetch user reports
  useEffect(() => {
    const fetchUserReportData = async () => {
      if (activeTab === "reports") {
        setLoading((prev) => ({ ...prev, reports: true }));

        const result = await getUserReports(username);

        if (result.success) {
          setReports(result.reports);
        } else {
          console.error("Failed to load user reports:", result.error);
        }

        setLoading((prev) => ({ ...prev, reports: false }));
      }
    };

    fetchUserReportData();
  }, [username, activeTab]);

  // Fetch user chat history
  useEffect(() => {
    const fetchUserChatData = async () => {
      if (activeTab === "chatHistory") {
        setLoading((prev) => ({ ...prev, chats: true }));

        const result = await getUserChatHistory(username);

        if (result.success) {
          setChatHistory(result.chatHistory);
        } else {
          console.error("Failed to load chat history:", result.error);
        }

        setLoading((prev) => ({ ...prev, chats: false }));
      }
    };

    fetchUserChatData();
  }, [username, activeTab]);

  // Function to navigate to report details
  const handleViewReport = (reportId) => {
    navigate(`/admin/reports/${reportId}`);
  };

  // Add skeleton loader for better perceived performance
  if (loading.profile) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-600 rounded w-1/4"></div>
          <div className="h-8 bg-gray-600 rounded w-24"></div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="border-b border-gray-700 mb-4 flex">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 rounded w-24 mr-2"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User: {user.username}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          Back
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="border-b border-gray-700 mb-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-4 ${
                activeTab === "profile"
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-gray-400"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-2 px-4 ${
                activeTab === "stats"
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-gray-400"
              }`}
            >
              Game Stats
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`py-2 px-4 ${
                activeTab === "reports"
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-gray-400"
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab("chatHistory")}
              className={`py-2 px-4 ${
                activeTab === "chatHistory"
                  ? "border-b-2 border-blue-500 text-white"
                  : "text-gray-400"
              }`}
            >
              Chat History
            </button>
          </nav>
        </div>

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-gray-400 text-sm">Email</h3>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Account Status</h3>
              <p
                className={
                  user.isActive !== false ? "text-green-500" : "text-red-500"
                }
              >
                {user.isActive !== false ? "Active" : "Suspended"}
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Role</h3>
              <p className="text-white">{user.isAdmin ? "Admin" : "Player"}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Created</h3>
              <p className="text-white">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-gray-400 text-sm">Games Played</h3>
              <p className="text-white">{user.stats?.gamesPlayed || 0}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Wins</h3>
              <p className="text-white">{user.stats?.wins || 0}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Correct Guesses</h3>
              <p className="text-white">{user.stats?.correctGuesses || 0}</p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Total Score</h3>
              <p className="text-white">{user.stats?.totalScore || 0}</p>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-2">Reports</h3>
            {loading.reports ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-700 rounded w-full"
                  ></div>
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(report.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {report.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded ${
                              report.status === "resolved"
                                ? "bg-green-900 text-green-300"
                                : report.status === "reviewed"
                                ? "bg-blue-900 text-blue-300"
                                : "bg-yellow-900 text-yellow-300"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewReport(report._id)}
                            className="text-blue-500 hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400">No reports found</p>
            )}
          </div>
        )}

        {activeTab === "chatHistory" && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-white mb-2">
              Recent Chat History
            </h3>
            {loading.chats ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-700 rounded w-full"></div>
                ))}
              </div>
            ) : chatHistory && chatHistory.length > 0 ? (
              <div className="bg-gray-700 rounded p-4 max-h-96 overflow-y-auto">
                {chatHistory.map((message, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-400 text-xs">
                      {new Date(message.timestamp).toLocaleString()}:
                    </span>
                    <span className="ml-2 text-white">{message.message}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      (Room: {message.roomId || message.lobbyObjectId})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No chat history found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
