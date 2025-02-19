import { useState } from 'react';
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import { createLobby } from '../../services/auth';

const LobbySettings = ({ user }) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    maxRounds: 3,
    revealCharacters: true,
    selectWord: true,
    selectCategory: true,
    playerLimit: 8,
  });

  const setMaxRounds = (value) =>
    setGameState((prev) => ({ ...prev, maxRounds: value }));
  const setRevealCharacters = (value) =>
    setGameState((prev) => ({ ...prev, revealCharacters: value }));
  const setSelectWord = (value) =>
    setGameState((prev) => ({ ...prev, selectWord: value }));
  const setSelectCategory = (value) =>
    setGameState((prev) => ({ ...prev, selectCategory: value }));
  const setPlayerLimit = (value) =>
    setGameState((prev) => ({ ...prev, playerLimit: value }));

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
  }, [navigate, user]);

  const handleCreateLobby = async () => {
    const response = await createLobby(gameState);
    if (response.success && response.roomId) {
      const roomId = response.roomId;
      navigate("/lobby/" + roomId);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-gray-100 rounded-lg p-6 shadow-lg max-w-2xl w-full">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Create a New Lobby
        </h3>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="maxRounds" className="text-gray-800">
              Max Rounds:
            </label>
            <input
              id="maxRounds"
              type="number"
              min="1"
              max="10"
              value={gameState.maxRounds}
              onChange={(e) =>
                setMaxRounds(
                  Math.min(Math.max(parseInt(e.target.value), 1), 10)
                )
              }
              className="px-2 py-1 text-gray-800 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-20"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="revealCharacters" className="text-gray-800">
              Reveal word while drawing:
            </label>
            <input
              id="revealCharacters"
              type="checkbox"
              checked={gameState.revealCharacters}
              onChange={(e) => setRevealCharacters(e.target.checked)}
              className="ml-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="selectWord" className="text-gray-800">
              Select word (if false, word is randomly chosen):
            </label>
            <input
              id="selectWord"
              type="checkbox"
              checked={gameState.selectWord}
              onChange={(e) => setSelectWord(e.target.checked)}
              className="ml-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="selectCategory" className="text-gray-800">
              Select category (if false, category is randomly chosen):
            </label>
            <input
              id="selectCategory"
              type="checkbox"
              checked={gameState.selectCategory}
              onChange={(e) => setSelectCategory(e.target.checked)}
              className="ml-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="playerLimit" className="text-gray-800">
              Player Limit:
            </label>
            <input
              id="playerLimit"
              type="number"
              min="2"
              max="12"
              value={gameState.playerLimit}
              onChange={(e) =>
                setPlayerLimit(
                  Math.min(Math.max(parseInt(e.target.value), 2), 12)
                )
              }
              className="px-2 py-1 text-gray-800 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-20"
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => handleCreateLobby()}
          >
            Create Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default LobbySettings;
