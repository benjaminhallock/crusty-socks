import { useState, useEffect } from "react";
import { getAllUsers, getAllLobbies } from "../services/auth";

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
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>

      <div className="space-y-6">
        <DataTable
          title="Users"
          headers={["Username", "Created At"]}
          data={data.users}
          renderRow={user => (
            <tr key={user._id} className="border-t">
              <td className="px-6 py-4">{user.username}</td>
              <td className="px-6 py-4">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          )}
        />

        <DataTable
          title="Active Lobbies"
          headers={["Room ID", "Game State", "Players"]}
          data={data.lobbies}
          renderRow={lobby => (
            <tr key={lobby._id} className="border-t">
              <td className="px-6 py-4">{lobby.roomId}</td>
              <td className="px-6 py-4">{lobby.gameState}</td>
              <td className="px-6 py-4">{lobby.players.length}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
};

const DataTable = ({ title, headers, data, renderRow }) => (
  <section>
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-6 py-3 text-left">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(renderRow)}
        </tbody>
      </table>
    </div>
  </section>
);

export default Admin;
