import { useState, useEffect } from "react";

import { getAllUsers, getAllLobbies, getAllReports } from "../../services/auth";

const Admin = () => {
  const [data, setData] = useState({ users: [], lobbies: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="p-4 text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-white text-2xl font-bold mb-4">Admin Portal</h1>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <section>
          <h2 className="text-white text-xl font-semibold mb-2 dark:text-white">Users ({data.users.length})</h2>
          <ul className="space-y-2">
            {data.users.map(user => (
              <li key={user._id} className="bg-white p-2 rounded dark:text-black">
                {user.username}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 dark:text-dark-200 text-white">
          Active Lobbies ({data.lobbies.length})</h2>
          <ul className="space-y-2">
            {data.lobbies.map(lobby => (
              <li key={lobby._id} className="bg-white p-2 rounded dark:text-black"> 
                Room: {lobby.roomId} - Players: {lobby.players.length}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-white text-xl font-semibold mb-2">Reports ({data.reports.length})</h2>
          <div className="space-y-2">
            {data.reports.map(report => (
              <div key={report._id} className="bg-white p-4 rounded dark:text-black">
                <div className="flex justify-between mb-2">
                  <span>Reported: {report.reportedUser}</span>
                  <span>By: {report.reportedBy}</span>
                  <span>Status: {report.status}</span>
                </div>
                <div className="mb-2">
                  <strong>Reason:</strong> {report.reason}
                </div>
                {report.drawingData && (
                  <img 
                    src={report.drawingData} 
                    alt="Reported drawing" 
                    className="max-w-md mb-2"
                  />
                )}
                {report.chatLogs && report.chatLogs.length > 0 && (
                  <div className="bg-gray-100 p-2 rounded">
                    <strong>Chat Logs:</strong>
                    {report.chatLogs.map((log, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-bold">{log.username}:</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
