import { useState, useEffect } from "react";
import GameRoom from "./components/GameRoom";
import { socket } from "./socket";
import HowToPlay from "./components/HowToPlay";
import { ThemeProvider, useTheme } from './context/ThemeContext';

const DarkModeToggle = () => {
  const { isDark, toggleDarkMode } = useTheme();
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

function App() {
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    socket.on("connect_error", () => {
      setError("Failed to connect to server");
    });

    return () => {
      socket.off("connect_error");
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-indigo-600 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5V14H8.5A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12H12V8.5A3.5,3.5 0 0,0 8.5,5M21,16A3,3 0 0,1 24,19A3,3 0 0,1 21,22A3,3 0 0,1 18,19A3,3 0 0,1 21,16Z" />
                </svg>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Pixel Party
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Draw, Guess, and Have Fun!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  1,234
                </div>
                <div className="text-gray-600">Games Played</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">567</div>
                <div className="text-gray-600">Players Online</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">89k</div>
                <div className="text-gray-600">Words Drawn</div>
              </div>
            </div>

            <div className="text-center mb-12">
              <button
                onClick={() => setIsPlaying(true)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-indigo-700 transform hover:scale-105 transition-all"
              >
                Start Playing Now!
              </button>
              <div className="mt-4 space-x-4">
                <HowToPlay />
                <button
                  onClick={() =>
                    window.open(
                      "https://twitter.com/intent/tweet?text=Join%20me%20in%20Pixel%20Party!"
                    )
                  }
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Share
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <h3 className="font-bold mb-2">Draw Together</h3>
                <p className="text-gray-600">Create masterpieces with friends</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🤝</div>
                <h3 className="font-bold mb-2">Make Friends</h3>
                <p className="text-gray-600">Join a friendly community</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="font-bold mb-2">Compete</h3>
                <p className="text-gray-600">Climb the leaderboard</p>
              </div>
            </div>

            <footer className="text-center text-gray-500 text-sm">
              <p>© 2024 Pixel Party. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
        <div className="container mx-auto px-4 pt-6"> {/* Added pt-6 here */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-indigo-600 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8.5,3A5.5,5.5 0 0,1 14,8.5V14H8.5A5.5,5.5 0 0,1 3,8.5A5.5,5.5 0 0,1 8.5,3M8.5,5A3.5,3.5 0 0,0 5,8.5A3.5,3.5 0 0,0 8.5,12H12V8.5A3.5,3.5 0 0,0 8.5,5M21,16A3,3 0 0,1 24,19A3,3 0 0,1 21,22A3,3 0 0,1 18,19A3,3 0 0,1 21,16Z" />
              </svg>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Pixel Party
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <HowToPlay />
              {isPlaying && (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Exit Game
                </button>
              )}
            </div>
          </div>

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
    </ThemeProvider>
  );
}

export default App;
