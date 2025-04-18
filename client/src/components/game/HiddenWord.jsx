import { useState, useEffect, useRef } from "react";

import { GAME_STATE, GAME_CONSTANTS } from "../../constants";

const HiddenWord = ({ lobby, user, onWordPick }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [wordChoices, setWordChoices] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const timerRef = useRef(null);
  const lastStartTimeRef = useRef(null);
  const WORD_SELECTION_TIME = GAME_CONSTANTS.WORD_SELECTION_TIME || 30; // Default to 30 seconds if not defined
  const [currentRound, setCurrentRound] = useState(lobby.currentRound || 1);

  // Use the user prop directly to determine if this user is the drawer
  const isDrawing = user?.username === lobby.currentDrawer;

  useEffect(() => {
    if (isDrawing) {
      setCurrentRound(lobby.currentRound);
    }
  }, [isDrawing, lobby.currentRound]);

  // Timer logic
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Skip timer setup for non-active states
    if (
      lobby.gameState !== GAME_STATE.DRAWING &&
      lobby.gameState !== GAME_STATE.PICKING_WORD
    ) {
      return;
    }

    // Calculate initial time left
    let initialTimeLeft = 0;
    const currentTime = Date.now();

    if (lobby.gameState === GAME_STATE.DRAWING && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      initialTimeLeft = Math.max(0, lobby.roundTime - elapsedSeconds);
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      initialTimeLeft = Math.max(0, WORD_SELECTION_TIME - elapsedSeconds);
    }

    // Update the time left
    setTimeLeft(initialTimeLeft);

    // Start the timer if time is remaining
    if (initialTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return newTime;
        });
      }, 1000);
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lobby.gameState, lobby.startTime, lobby.timeLeft, lobby.roundTime]);

  // Word selection logic
  useEffect(() => {
    if (
      lobby.gameState === GAME_STATE.PICKING_WORD &&
      user.username === lobby.currentDrawer
    ) {
      // Parse word choices from the comma-separated string
      const choices = lobby.currentWord
        ? lobby.currentWord.split(",").map((w) => w.trim())
        : [];

      setWordChoices(choices);
    }
  }, [lobby.gameState, lobby.currentWord, user.username, lobby.currentDrawer]);

  // Format the timer display
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate width based on the correct time limit for each state
  const getTimerWidth = () => {
    if (lobby.gameState === GAME_STATE.DRAWING) {
      return Math.max(0, (timeLeft / lobby.roundTime) * 100);
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      // Use WORD_SELECTION_TIME constant for picking phase
      return Math.max(0, (timeLeft / WORD_SELECTION_TIME) * 100);
    }
    return 100;
  };

  // Calculate the current reveal percentage based on time elapsed
  const getCurrentRevealPercentage = () => {
    if (!lobby.revealCharacters || lobby.gameState !== GAME_STATE.DRAWING)
      return 0;

    // Calculate time elapsed as a percentage of total round time
    const timeElapsedPercent = Math.min(
      100,
      ((lobby.roundTime - timeLeft) / lobby.roundTime) * 100
    );

    // Scale the reveal percentage based on time elapsed and max reveal rate
    return Math.min(
      timeElapsedPercent * (lobby.revealCharacters / 100),
      lobby.revealCharacters
    );
  };

  // Determine which letters to reveal based on the reveal percentage
  const getLetterRevealIndices = (word, revealPercentage) => {
    if (!word) return new Set();
    const letters = word.split("");
    const revealIndices = new Set();

    // Always reveal spaces
    letters.forEach((char, idx) => {
      if (char === " ") revealIndices.add(idx);
    });

    // Use characters' charCode sum as a seed for deterministic reveals
    const wordSeed = word
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const positions = Array.from({ length: word.length }, (_, i) => i)
      .filter((i) => !revealIndices.has(i))
      .sort((a, b) => {
        const scoreA = (word[a].charCodeAt(0) * wordSeed) % word.length;
        const scoreB = (word[b].charCodeAt(0) * wordSeed) % word.length;
        return scoreA - scoreB;
      });

    const numToReveal = Math.floor((letters.length * revealPercentage) / 100);
    for (let i = 0; i < numToReveal && i < positions.length; i++) {
      revealIndices.add(positions[i]);
    }

    return revealIndices;
  };

  // Generate the masked word with revealed letters
  const getMaskedWord = () => {
    if (
      !lobby.currentWord ||
      lobby.gameState === GAME_STATE.WAITING ||
      lobby.gameState === GAME_STATE.PICKING_WORD
    ) {
      return "";
    }

    // Drawer always sees the full word
    if (isDrawing) {
      return lobby.currentWord;
    }

    // At the end of drawing or end states, reveal the word
    if (
      lobby.gameState === GAME_STATE.DRAW_END ||
      lobby.gameState === GAME_STATE.ROUND_END ||
      lobby.gameState === GAME_STATE.FINISHED
    ) {
      return lobby.currentWord;
    }

    // During drawing, show masked word with gradual reveals
    if (lobby.gameState === GAME_STATE.DRAWING) {
      const letters = lobby.currentWord.split("");
      // Get current reveal percentage based on elapsed time
      const currentRevealPercentage = getCurrentRevealPercentage();
      const revealIndices = getLetterRevealIndices(
        lobby.currentWord,
        currentRevealPercentage
      );

      return letters
        .map((char, idx) => {
          if (revealIndices.has(idx)) return char;
          // Original character was a space, use double nbsp
          if (char === " ") return "\u00A0\u00A0";
          // Regular character replaced with underscore
          return "_";
        })
        .join("\u00A0"); // Single non-breaking space for closer spacing
    }

    return "";
  };

  // Generate the status text based on the game state
  const getStatusText = () => {
    const roundDisplay =
      lobby.gameState !== GAME_STATE.WAITING
        ? `Round ${lobby.currentRound || 1}/${lobby.maxRounds} - `
        : "";

    if (lobby.gameState === GAME_STATE.WAITING) {
      return "Waiting for players...";
    }
    if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      return `${roundDisplay}${
        isDrawing ? "Choose your word!" : "Waiting for word selection..."
      }`;
    }
    if (lobby.gameState === GAME_STATE.DRAWING) {
      return `${roundDisplay}Time left: ${timeLeft}s`;
    }
    if (lobby.gameState === GAME_STATE.DRAW_END) {
      return `${roundDisplay}Time's up! The word was: ${lobby.currentWord}`;
    }
    if (lobby.gameState === GAME_STATE.ROUND_END) {
      return `${roundDisplay}Round complete!`;
    }
    if (lobby.gameState === GAME_STATE.FINISHED) {
      return "Game Over!";
    }
    return "";
  };

  return (
    <div className="flex flex-col items-center justify-center py-3 px-4 md:py-4 md:px-6 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-700/95 dark:to-gray-800/95 rounded-xl shadow-xl transition-all duration-300">
      {/* Word Display */}
      <div className="flex flex-col items-center gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="relative">
          <div className="text-2xl md:text-3xl font-mono tracking-[0.5em] text-gray-800 dark:text-gray-200 min-h-[1.5em] text-center py-1">
            <span
              className={
                timeLeft < 10
                  ? "animate-pulse text-red-500 dark:text-red-400"
                  : ""
              }
            >
              {getMaskedWord()}
            </span>
          </div>
          {lobby.gameState === GAME_STATE.DRAWING && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          )}
        </div>

        <div
          className={`text-lg font-medium px-6 py-2.5 rounded transition-all duration-300
          ${
            lobby.gameState === GAME_STATE.WAITING
              ? "bg-gray-100 dark:bg-gray-600/50"
              : lobby.gameState === GAME_STATE.DRAWING
              ? "bg-indigo-100/0 dark:bg-indigo-900/0"
              : lobby.gameState === GAME_STATE.FINISHED
              ? "bg-blue-100 dark:bg-blue-900/50"
              : "bg-gray-100 dark:bg-gray-600/50"
          }`}
        >
          <span className="text-gray-700 dark:text-gray-200">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full max-w-xl mb-4">
        <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div
            className={`absolute h-full transition-all duration-1000 ease-linear rounded-full
              ${
                timeLeft < 10
                  ? "bg-red-500 animate-pulse"
                  : timeLeft < 30
                  ? "bg-yellow-500"
                  : "bg-emerald-500"
              }`}
            style={{
              width: `${getTimerWidth()}%`,
            }}
          />
        </div>
      </div>

      {/* Word Selection Buttons */}
      {lobby.gameState === GAME_STATE.PICKING_WORD && isDrawing && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {wordChoices
            .slice(0, lobby.selectWord || 3)
            .map((wordOption, index) => (
              <button
                key={index}
                onClick={() => onWordPick(wordOption)}
                className="group relative px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 
                text-white font-medium rounded-lg shadow-lg overflow-hidden
                hover:from-blue-600 hover:to-blue-700 
                transform hover:scale-105 
                transition-all duration-200 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="relative z-10">{wordOption}</div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default HiddenWord;
