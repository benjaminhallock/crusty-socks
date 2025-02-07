import { useState, useEffect } from "react";
import { getAllUsers, getAllLobbies } from "../services/auth";

const Admin = () => {
  const [users, setUsers] = useState([]);  // Initialize as empty array
  const [lobbies, setLobbies] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const usersResponse = await getAllUsers();
        const lobbiesResponse = await getAllLobbies();

        if (!usersResponse.success) {
          throw new Error(usersResponse.message);
        }
        if (!lobbiesResponse.success) {
          throw new Error(lobbiesResponse.message);
        }

        setUsers(usersResponse.users || []);
        setLobbies(lobbiesResponse.lobbies || []);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-2xl mt-8">Loading...</div>;

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Username</th>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t">
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user._id}</td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Lobbies</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Room ID</th>
                  <th className="px-6 py-3 text-left">Game State</th>
                  <th className="px-6 py-3 text-left">Players</th>
                  <th className="px-6 py-3 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {lobbies && lobbies.map((lobby) => (
                  <tr key={lobby._id} className="border-t">
                    <td className="px-6 py-4">{lobby.roomId}</td>
                    <td className="px-6 py-4">{lobby.gameState}</td>
                    <td className="px-6 py-4">{lobby.players.length}</td>
                    <td className="px-6 py-4">
                      {new Date(lobby.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
