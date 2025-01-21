import { useState, useEffect } from "react";
import GameRoom from "./components/GameRoom";
import { socket } from "./socket";

function App() {
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    socket.on('connect_error', () => {
      setError('Failed to connect to server');
    });

    return () => {
      socket.off('connect_error');
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">
          Drawing Game
        </h1>
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          ) : (
            <GameRoom
              onError={setError}
              onDebug={(msg) => console.log("Debug:", msg)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
