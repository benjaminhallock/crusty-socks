import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import LoadingSpinner from "../common/ui/LoadingSpinner";
import {
  getAllUsers,
  getAllLobbies,
  getAllReports,
  updateReportStatus,
  updateReport,
  updateUser,
  updateLobby,
} from "../../services/api";

import { GAME_STATE as gs } from "../../constants";

const Admin = () => {
  const [data, setData] = useState({ users: [], lobbies: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: "timestamp",
    direction: "desc",
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Enable returning to the first page when changing views or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, searchTerm]);

  // Pagination utils
  const paginateData = (items) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const totalPages = (items) => Math.ceil(items.length / itemsPerPage);

  // Pagination controls component
  const PaginationControls = ({ totalItems }) => {
    const pages = totalPages(totalItems);
    if (pages <= 1) return null;

    return (
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems.length)} of{" "}
          {totalItems.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pages))}
            disabled={currentPage === pages}
            className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersResponse, lobbiesResponse, reportsResponse] =
          await Promise.all([getAllUsers(), getAllLobbies(), getAllReports()]);

        setData({
          users: usersResponse.success ? usersResponse.users : [],
          lobbies: lobbiesResponse.success ? lobbiesResponse.lobbies : [],
          reports: reportsResponse.success ? reportsResponse.reports : [],
        });

        const errors = [];
        if (!usersResponse.success)
          errors.push(`Users: ${usersResponse.error}`);
        if (!lobbiesResponse.success)
          errors.push(`Lobbies: ${lobbiesResponse.error}`);
        if (!reportsResponse.success)
          errors.push(`Reports: ${reportsResponse.error}`);

        if (errors.length > 0) {
          setError(`Failed to load some data: ${errors.join(", ")}`);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError("Failed to load admin data. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setError("");
      const result = await updateReportStatus(reportId, newStatus);
      if (result.success) {
        setData((prev) => ({
          ...prev,
          reports: prev.reports.map((report) =>
            report._id === reportId ? { ...report, status: newStatus } : report
          ),
        }));
        showSuccessMessage("Report status updated successfully");
      } else {
        setError(
          "Failed to update report status: " + (result.error || "Unknown error")
        );
      }
    } catch (error) {
      setError("An error occurred while updating report status");
    }
  };

  const handleEditClick = (item, type) => {
    setEditingItem({ id: item._id, type });
    setEditFormData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const { type, id } = editingItem;
      let result;

      switch (type) {
        case "user":
          // Ensure we're passing the correct userId
          const userId = editFormData._id || id;
          result = await updateUser(userId, editFormData);
          if (result.success) {
            setData((prev) => ({
              ...prev,
              users: prev.users.map((user) =>
                user._id === userId ? result.user : user
              ),
            }));
          } else {
            setError(result.error || "Failed to update user");
          }
          break;
        case "lobby":
          result = await updateLobby(id, editFormData);
          if (result.success) {
            setData((prev) => ({
              ...prev,
              lobbies: prev.lobbies.map((lobby) =>
                lobby._id === id ? result.lobby : lobby
              ),
            }));
          }
          break;
        case "report":
          result = await updateReport(id, editFormData);
          if (result.success) {
            setData((prev) => ({
              ...prev,
              reports: prev.reports.map((report) =>
                report._id === id ? result.report : report
              ),
            }));
          }
          break;
        default:
          setError("Unknown item type");
          return;
      }

      if (result?.success) {
        showSuccessMessage(
          `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
        );
        setEditingItem(null);
        setEditFormData({});
      }
    } catch (err) {
      setError(`An error occurred while updating: ${err.message}`);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const filterAndSortData = (items, type) => {
    const searchLower = searchTerm.toLowerCase();

    let filtered = items;
    if (searchTerm) {
      filtered = items.filter((item) => {
        switch (type) {
          case "reports":
            return (
              item.reportedUser?.toLowerCase().includes(searchLower) ||
              item.reportedBy?.toLowerCase().includes(searchLower) ||
              item.reason?.toLowerCase().includes(searchLower) ||
              item.status?.toLowerCase().includes(searchLower)
            );
          case "users":
            return (
              item.username?.toLowerCase().includes(searchLower) ||
              item.email?.toLowerCase().includes(searchLower)
            );
          case "lobbies":
            return item.roomId?.toLowerCase().includes(searchLower);
          default:
            return false;
        }
      });
    }

    return paginateData(
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? -1 : 1;
      })
    );
  };

  const renderEditForm = () => {
    if (!editingItem) return null;

    const { type } = editingItem;

    switch (type) {
      case "user":
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl text-white font-bold mb-4">Edit User</h2>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  name="username"
                  value={editFormData.username || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  name="email"
                  value={editFormData.email || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={editFormData.isAdmin || false}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Admin
                </label>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );

      case "lobby":
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl text-white font-bold mb-4">Edit Lobby</h2>

              {/* Basic Lobby Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-2">Room ID</label>
                  <input
                    name="roomId"
                    value={editFormData.roomId || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Player Limit
                  </label>
                  <input
                    type="number"
                    name="playerLimit"
                    min="2"
                    max="12"
                    value={editFormData.playerLimit || 8}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>
              </div>

              {/* Game Configuration */}
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">
                Game Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-2">Max Rounds</label>
                  <input
                    type="number"
                    name="maxRounds"
                    min="1"
                    max="10"
                    value={editFormData.maxRounds || 3}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Round Time (seconds)
                  </label>
                  <input
                    type="number"
                    name="roundTime"
                    min="30"
                    max="180"
                    value={editFormData.roundTime || 60}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Category</label>
                  <select
                    name="selectCategory"
                    value={editFormData.selectCategory || "random"}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  >
                    <option value="random">Random</option>
                    <option value="animals">Animals</option>
                    <option value="food">Food</option>
                    <option value="sports">Sports</option>
                    <option value="movies">Movies</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Words to Select From
                  </label>
                  <input
                    type="number"
                    name="selectWord"
                    min="1"
                    max="5"
                    value={editFormData.selectWord || 3}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    Reveal Characters (%)
                  </label>
                  <input
                    type="number"
                    name="revealCharacters"
                    min="0"
                    max="75"
                    value={editFormData.revealCharacters || 35}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Game State</label>
                  <select
                    name="gameState"
                    value={editFormData.gameState || "WAITING"}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  >
                    <option value={gs.WAITING}>Waiting</option>
                    <option value={gs.PICKING_WORD}>Picking Word</option>
                    <option value={gs.DRAWING}>Drawing</option>
                    <option value={gs.ROUND_END}>Round Ended</option>
                    <option value={gs.FINISHED}>Game Ended</option>
                  </select>
                </div>
              </div>

              {/* Players Section */}
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">
                Players
              </h3>
              {editFormData.players && editFormData.players.length > 0 ? (
                <div className="bg-gray-700 rounded p-2 mb-6 max-h-40 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs">
                        <th className="p-2">Username</th>
                        <th className="p-2">Score</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editFormData.players.map((player, index) => (
                        <tr key={index} className="border-t border-gray-600">
                          <td className="p-2 text-gray-300">
                            {player.username}
                          </td>
                          <td className="p-2 text-gray-300">{player.score}</td>
                          <td className="p-2 text-gray-300">
                            {player.username === editFormData.currentDrawer
                              ? "Drawing"
                              : player.hasGuessedCorrect
                              ? "Guessed"
                              : "Guessing"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No players in this lobby</p>
              )}

              {/* Chat Messages Section */}
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">
                Chat Messages
              </h3>
              {editFormData.messages && editFormData.messages.length > 0 ? (
                <div className="bg-gray-700 rounded p-2 mb-6 max-h-40 overflow-y-auto">
                  {editFormData.messages.map((message, index) => (
                    <div
                      key={index}
                      className="mb-2 border-b border-gray-600 pb-1"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-blue-400">
                          {message.user}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No chat messages</p>
              )}

              {/* Kicked Users Section */}
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">
                Kicked Users
              </h3>
              {editFormData.kickedUsers &&
              editFormData.kickedUsers.length > 0 ? (
                <div className="bg-gray-700 rounded p-2 mb-6 max-h-40 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs">
                        <th className="p-2">Username</th>
                        <th className="p-2">Kicked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editFormData.kickedUsers.map((kicked, index) => (
                        <tr key={index} className="border-t border-gray-600">
                          <td className="p-2 text-gray-300">
                            {kicked.username}
                          </td>
                          <td className="p-2 text-gray-300">
                            {new Date(kicked.kickedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 mb-6">No kicked users</p>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );

      case "report":
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl text-white font-bold mb-4">Edit Report</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Reported User
                  </label>
                  <input
                    name="reportedUser"
                    value={editFormData.reportedUser || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">
                    Reported By
                  </label>
                  <input
                    name="reportedBy"
                    value={editFormData.reportedBy || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Reason</label>
                <textarea
                  name="reason"
                  value={editFormData.reason || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                  rows="2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  name="additionalComments"
                  value={editFormData.additionalComments || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Status</label>
                <select
                  name="status"
                  value={editFormData.status || "pending"}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Chat Logs</label>
                <div className="bg-gray-700 p-3 rounded max-h-48 overflow-y-auto">
                  {editFormData.chatLogs && editFormData.chatLogs.length > 0 ? (
                    editFormData.chatLogs.map((log, index) => (
                      <div key={index} className="mb-2 text-sm">
                        <span className="text-blue-400">{log.username}: </span>
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No chat logs available</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "users":
        return (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterAndSortData(data.users, "users").map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.isAdmin
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {user.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditClick(user, "user")}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "lobbies":
        return (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Active Lobbies
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Room ID
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Game State
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Round Time
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reveal %
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Current Round
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterAndSortData(data.lobbies, "lobbies").map((lobby) => (
                    <tr
                      key={lobby._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                        {lobby.roomId}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                        {lobby.players?.length || 0}/{lobby.playerLimit || 8}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            lobby.gameState === gs.WAITING
                              ? "bg-gray-500 text-white"
                              : lobby.gameState === gs.PICKING_WORD
                              ? "bg-blue-500 text-white"
                              : lobby.gameState === gs.DRAWING
                              ? "bg-green-500 text-white"
                              : lobby.gameState === gs.DRAW_END
                              ? "bg-yellow-500 text-white"
                              : lobby.gameState === gs.ROUND_END
                              ? "bg-purple-500 text-white"
                              : lobby.gameState === gs.FINISHED
                              ? "bg-red-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {lobby.gameState
                            ? lobby.gameState.replace("_", " ")
                            : "WAITING"}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300 capitalize">
                        {lobby.selectCategory || "random"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                        {lobby.roundTime || 60}s
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                        {lobby.revealCharacters || 35}%
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                        {lobby.currentRound || 1}/{lobby.maxRounds || 3}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(lobby, "lobby")}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Reports
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reported User
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterAndSortData(data.reports, "reports").map((report) => (
                    <tr
                      key={report._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {report.reportedUser}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {report.reportedBy}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        <div className="max-w-xs">
                          <span className="font-medium">{report.reason}</span>
                          {report.additionalComments && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate">
                              {report.additionalComments}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            report.status === "pending"
                              ? "bg-yellow-500 text-yellow-900"
                              : report.status === "reviewed"
                              ? "bg-blue-500 text-blue-900"
                              : "bg-green-500 text-green-900"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {new Date(report.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <select
                            value={report.status}
                            onChange={(e) =>
                              handleUpdateStatus(report._id, e.target.value)
                            }
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-xs md:text-sm border border-gray-300 dark:border-gray-600"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <button
                            onClick={() => handleEditClick(report, "report")}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Overview content */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Active Games
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Room ID
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Players
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Game State
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Round Time
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reveal %
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Current Round
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.lobbies.map((lobby) => (
                      <tr
                        key={lobby._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                          {lobby.roomId}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                          {lobby.players?.length || 0}/{lobby.playerLimit || 8}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              lobby.gameState === gs.WAITING
                                ? "bg-gray-500 text-white"
                                : lobby.gameState === gs.PICKING_WORD
                                ? "bg-blue-500 text-white"
                                : lobby.gameState === gs.DRAWING
                                ? "bg-green-500 text-white"
                                : lobby.gameState === gs.DRAW_END
                                ? "bg-yellow-500 text-white"
                                : lobby.gameState === gs.ROUND_END
                                ? "bg-purple-500 text-white"
                                : lobby.gameState === gs.FINISHED
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {lobby.gameState
                              ? lobby.gameState.replace("_", " ")
                              : "WAITING"}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300 capitalize">
                          {lobby.selectCategory || "random"}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                          {lobby.roundTime || 60}s
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                          {lobby.revealCharacters || 35}%
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                          {lobby.currentRound || 1}/{lobby.maxRounds || 3}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(lobby, "lobby")}
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PaginationControls totalItems={data.lobbies} />
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Transition
      show={true}
      appear={true}
      enter="transition-all duration-300"
      enterFrom="opacity-0 translate-y-6"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h1>
              {activeView !== "overview" && (
                <button
                  onClick={() => setActiveView("overview")}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Overview
                </button>
              )}
            </div>
            {error && (
              <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded relative">
                {successMessage}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: data.users.length,
                view: "users",
                icon: (
                  <svg
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ),
              },
              {
                label: "Total Lobbies",
                value: data.lobbies.length,
                view: "lobbies",
                icon: (
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
              {
                label: "Total Reports",
                value: data.reports.length,
                view: "reports",
                icon: (
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ),
              },
              {
                label: "Active Lobbies",
                value: data.lobbies.filter((lobby) => lobby.isActive).length,
                view: "lobbies",
                icon: (
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                ),
              },
            ].map((stat, index) => (
              <button
                key={index}
                onClick={() => setActiveView(stat.view)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-full p-3 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors">
                    {stat.icon}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          {renderContent()}
        </div>

        {/* Edit Modal */}
        {renderEditForm()}
      </div>
    </Transition>
  );
};

export default Admin;
