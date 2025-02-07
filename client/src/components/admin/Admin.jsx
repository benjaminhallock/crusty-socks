import { useState, useEffect } from "react";

import { getAllUsers, getAllLobbies } from "../../services/auth";

const Admin = () => {
  const [data, setData] = useState({ users: [], lobbies: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, lobbiesResponse] = await Promise.all([
          getAllUsers(),
          getAllLobbies()
        ]);
        setData({
          users: usersResponse.users || [],
          lobbies: lobbiesResponse.lobbies || []
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Users ({data.users.length})</h2>
          <ul className="space-y-2">
            {data.users.map(user => (
              <li key={user._id} className="bg-white p-2 rounded">
                {user.username}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Active Lobbies ({data.lobbies.length})</h2>
          <ul className="space-y-2">
            {data.lobbies.map(lobby => (
              <li key={lobby._id} className="bg-white p-2 rounded">
                Room: {lobby.roomId} - Players: {lobby.players.length}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Admin;
