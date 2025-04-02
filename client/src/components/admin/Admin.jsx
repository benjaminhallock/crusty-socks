import { useState, useEffect } from "react";

import { getAllReports, updateReportStatus, updateReport } from "../../services/reports";
import { getAllUsers, getAllLobbies } from "../../services/auth";
import { updateUser } from "../../services/reports";
import { updateLobby } from "../../services/reports";

const Admin = ({ user }) => {
  const [data, setData] = useState({ users: [], lobbies: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "timestamp", direction: "desc" });
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has admin privileges
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError("You don't have permission to access this page");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [usersResponse, lobbiesResponse, reportsResponse] = await Promise.all([
          getAllUsers(),
          getAllLobbies(),
          getAllReports()
        ]);

        setData({
          users: usersResponse.success ? usersResponse.users : [],
          lobbies: lobbiesResponse.success ? lobbiesResponse.lobbies : [],
          reports: reportsResponse.success ? reportsResponse.reports : []
        });

        if (!usersResponse.success || !lobbiesResponse.success || !reportsResponse.success) {
          setError('Some data failed to load. Please refresh to try again.');
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load admin data. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const result = await updateReportStatus(reportId, newStatus);
      if (result.success) {
        setData(prev => ({
          ...prev,
          reports: prev.reports.map(report => 
            report._id === reportId ? { ...report, status: newStatus } : report
          )
        }));
        showSuccessMessage("Report status updated successfully");
      } else {
        setError("Failed to update report status: " + result.error);
      }
    } catch (err) {
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
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSaveEdit = async () => {
    try {
      const { type, id } = editingItem;
      let result;
      
      switch (type) {
        case 'user':
          result = await updateUser(id, editFormData);
          if (result.success) {
            setData(prev => ({
              ...prev,
              users: prev.users.map(user => 
                user._id === id ? result.user : user
              )
            }));
          }
          break;
        case 'lobby':
          result = await updateLobby(id, editFormData);
          if (result.success) {
            setData(prev => ({
              ...prev,
              lobbies: prev.lobbies.map(lobby => 
                lobby._id === id ? result.lobby : lobby
              )
            }));
          }
          break;
        case 'report':
          result = await updateReport(id, editFormData);
          if (result.success) {
            setData(prev => ({
              ...prev,
              reports: prev.reports.map(report => 
                report._id === id ? result.report : report
              )
            }));
          }
          break;
        default:
          setError("Unknown item type");
          return;
      }
      
      if (result.success) {
        showSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
        setEditingItem(null);
        setEditFormData({});
      } else {
        setError(`Failed to update ${type}: ${result.error}`);
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
      filtered = items.filter(item => {
        switch (type) {
          case 'reports':
            return item.reportedUser?.toLowerCase().includes(searchLower) ||
                   item.reportedBy?.toLowerCase().includes(searchLower) ||
                   item.reason?.toLowerCase().includes(searchLower) ||
                   item.status?.toLowerCase().includes(searchLower);
          case 'users':
            return item.username?.toLowerCase().includes(searchLower) ||
                   item.email?.toLowerCase().includes(searchLower);
          case 'lobbies':
            return item.roomId?.toLowerCase().includes(searchLower);
          default:
            return false;
        }
      });
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  // Render edit form based on the item type
  const renderEditForm = () => {
    if (!editingItem) return null;
    
    const { type } = editingItem;
    
    switch (type) {
      case 'user':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl text-white font-bold mb-4">Edit User</h2>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  name="username"
                  value={editFormData.username || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  name="email"
                  value={editFormData.email || ''}
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
        
      case 'lobby':
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
                    value={editFormData.roomId || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Player Limit</label>
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
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">Game Configuration</h3>
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
                  <label className="block text-gray-300 mb-2">Round Time (seconds)</label>
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
                    value={editFormData.selectCategory || 'random'}
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
                  <label className="block text-gray-300 mb-2">Words to Select From</label>
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
                  <label className="block text-gray-300 mb-2">Reveal Characters (%)</label>
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
                    value={editFormData.gameState || 'WAITING'}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded"
                  >
                    <option value="WAITING">Waiting</option>
                    <option value="STARTING">Starting</option>
                    <option value="CHOOSING_WORD">Choosing Word</option>
                    <option value="DRAWING">Drawing</option>
                    <option value="ROUND_ENDED">Round Ended</option>
                    <option value="GAME_ENDED">Game Ended</option>
                  </select>
                </div>
              </div>
              
              {/* Players Section */}
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">Players</h3>
              {(editFormData.players && editFormData.players.length > 0) ? (
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
                          <td className="p-2 text-gray-300">{player.username}</td>
                          <td className="p-2 text-gray-300">{player.score}</td>
                          <td className="p-2 text-gray-300">
                            {player.username === editFormData.currentDrawer ? 'Drawing' : 
                             player.hasGuessedCorrect ? 'Guessed' : 'Guessing'}
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
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">Chat Messages</h3>
              {(editFormData.messages && editFormData.messages.length > 0) ? (
                <div className="bg-gray-700 rounded p-2 mb-6 max-h-40 overflow-y-auto">
                  {editFormData.messages.map((message, index) => (
                    <div key={index} className="mb-2 border-b border-gray-600 pb-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-blue-400">{message.user}</span>
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
              <h3 className="text-lg text-white font-semibold mb-2 border-t border-gray-700 pt-4">Kicked Users</h3>
              {(editFormData.kickedUsers && editFormData.kickedUsers.length > 0) ? (
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
                          <td className="p-2 text-gray-300">{kicked.username}</td>
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
        
      case 'report':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl text-white font-bold mb-4">Edit Report</h2>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Reported User</label>
                <input
                  name="reportedUser"
                  value={editFormData.reportedUser || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Reported By</label>
                <input
                  name="reportedBy"
                  value={editFormData.reportedBy || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Reason</label>
                <textarea
                  name="reason"
                  value={editFormData.reason || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Status</label>
                <select
                  name="status"
                  value={editFormData.status || 'pending'}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // On mobile, close the sidebar after selecting a tab
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 relative">
      {/* Mobile Header with Toggle Button */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-white text-xl font-bold">Admin Portal</h1>
        <button 
          onClick={toggleSidebar}
          className="text-white p-2 rounded hover:bg-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gray-800 p-4 md:h-screen fixed md:static z-10 inset-0 md:inset-auto overflow-y-auto`}>
        <h1 className="text-white text-2xl font-bold mb-8 hidden md:block">Admin Portal</h1>
        <nav>
          {['reports', 'users', 'lobbies'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`w-full text-left py-2 px-4 rounded mb-2 ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content - Full width on mobile */}
      <div className="flex-1 p-4 md:p-8 overflow-auto w-full">
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Current Tab Indicator for Mobile */}
        <div className="md:hidden mb-4">
          <h2 className="text-xl font-bold text-white">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Reports Table with Responsive Design */}
        {activeTab === 'reports' && (
          <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr className="border-b border-gray-700">
                  {['Reported User', 'Reported By', 'Reason', 'Status', 'Timestamp'].map((header) => (
                    <th
                      key={header}
                      onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
                      className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                    >
                      {header}
                      {sortConfig.field === header.toLowerCase().replace(' ', '') && (
                        <span className="ml-2">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-3 md:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.reports, 'reports').map((report) => (
                  <tr key={report._id} className="hover:bg-gray-700">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300 whitespace-nowrap">{report.reportedUser}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300 whitespace-nowrap">{report.reportedBy}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">{report.reason}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                        report.status === 'reviewed' ? 'bg-blue-500 text-blue-900' :
                        'bg-green-500 text-green-900'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300 whitespace-nowrap">
                      {new Date(report.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <div className="flex flex-col md:flex-row gap-2">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                          className="bg-gray-700 text-white rounded p-1 text-xs md:text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => handleEditClick(report, 'report')}
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
        )}

        {/* Users Table with Responsive Design */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr className="border-b border-gray-700">
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.users, 'users').map((user) => (
                  <tr key={user._id} className="hover:bg-gray-700">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">{user.username}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">{user.email}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">
                      {user.isAdmin ? "Yes" : "No"}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <button
                        onClick={() => handleEditClick(user, 'user')}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lobbies Table with Responsive Design and Additional Columns */}
        {activeTab === 'lobbies' && (
          <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700">
                <tr className="border-b border-gray-700">
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Room ID
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Game State
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Round Time
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Reveal %
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Current Round
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.lobbies, 'lobbies').map((lobby) => (
                  <tr key={lobby._id} className="hover:bg-gray-700">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">{lobby.roomId}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">
                      {lobby.players?.length || 0}/{lobby.playerLimit || 8}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lobby.gameState === 'WAITING' ? 'bg-gray-500 text-white' :
                        lobby.gameState === 'STARTING' ? 'bg-blue-500 text-white' :
                        lobby.gameState === 'DRAWING' ? 'bg-green-500 text-white' :
                        lobby.gameState === 'CHOOSING_WORD' ? 'bg-yellow-500 text-white' :
                        lobby.gameState === 'ROUND_ENDED' ? 'bg-purple-500 text-white' :
                        lobby.gameState === 'GAME_ENDED' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {lobby.gameState ? lobby.gameState.replace('_', ' ') : 'WAITING'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300 capitalize">
                      {lobby.selectCategory || 'random'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">
                      {lobby.roundTime || 60}s
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">
                      {lobby.revealCharacters || 35}%
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-300">
                      {lobby.currentRound || 1}/{lobby.maxRounds || 3}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(lobby, 'lobby')}
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
        )}
        
        {/* Edit Modal */}
        {renderEditForm()}
      </div>
    </div>
  );
};

export default Admin;
