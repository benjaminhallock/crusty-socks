import { useState, useEffect } from "react";
import { getAllUsers, getAllLobbies } from "../../services/auth";
import { getAllReports } from "../../services/reports";
import { updateReportStatus } from "../../services/reports";

const Admin = () => {
  const [data, setData] = useState({ users: [], lobbies: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "timestamp", direction: "desc" });

  useEffect(() => {
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
  }, []);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    const result = await updateReportStatus(reportId, newStatus);
    if (result.success) {
      setData(prev => ({
        ...prev,
        reports: prev.reports.map(report => 
          report._id === reportId ? { ...report, status: newStatus } : report
        )
      }));
    }
  };

  const filterAndSortData = (items, type) => {
    const searchLower = searchTerm.toLowerCase();
    
    let filtered = items;
    if (searchTerm) {
      filtered = items.filter(item => {
        switch (type) {
          case 'reports':
            return item.reportedUser.toLowerCase().includes(searchLower) ||
                   item.reportedBy.toLowerCase().includes(searchLower) ||
                   item.reason.toLowerCase().includes(searchLower) ||
                   item.status.toLowerCase().includes(searchLower);
          case 'users':
            return item.username.toLowerCase().includes(searchLower);
          case 'lobbies':
            return item.roomId.toLowerCase().includes(searchLower);
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

  if (loading) {
    return (
      <div className="p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <h1 className="text-white text-2xl font-bold mb-8">Admin Portal</h1>
        <nav>
          {['reports', 'users', 'lobbies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

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

        {/* Reports Table */}
        {activeTab === 'reports' && (
          <div className="bg-gray-800 rounded-lg shadow">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  {['Reported User', 'Reported By', 'Reason', 'Status', 'Timestamp'].map((header) => (
                    <th
                      key={header}
                      onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                    >
                      {header}
                      {sortConfig.field === header.toLowerCase().replace(' ', '') && (
                        <span className="ml-2">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.reports, 'reports').map((report) => (
                  <tr key={report._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-300">{report.reportedUser}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{report.reportedBy}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{report.reason}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                        report.status === 'reviewed' ? 'bg-blue-500 text-blue-900' :
                        'bg-green-500 text-green-900'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(report.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                        className="bg-gray-700 text-white rounded p-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg shadow">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.users, 'users').map((user) => (
                  <tr key={user._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-300">{user.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lobbies Table */}
        {activeTab === 'lobbies' && (
          <div className="bg-gray-800 rounded-lg shadow">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Room ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Players
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filterAndSortData(data.lobbies, 'lobbies').map((lobby) => (
                  <tr key={lobby._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-300">{lobby.roomId}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{lobby.players.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
