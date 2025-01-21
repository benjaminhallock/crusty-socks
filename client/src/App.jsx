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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-indigo-600 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5V14H8.5A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12H12V8.5A3.5,3.5 0 0,0 8.5,5M21,16A3,3 0 0,1 24,19A3,3 0 0,1 21,22A3,3 0 0,1 18,19A3,3 0 0,1 21,16Z"/>
            </svg>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Pixel Party
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Draw, Guess, and Have Fun!</p>
        </div>
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
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2024 Pixel Party. All rights reserved.</p>
          <p>Made with ❤️ by your name</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
