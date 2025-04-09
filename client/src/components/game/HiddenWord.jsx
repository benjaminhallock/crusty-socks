import { useState, useEffect, useRef } from "react";

import { GAME_STATE, GAME_CONSTANTS } from "../../constants";

// HiddenWord component displays the hidden word, timer, and game status
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
    } else {
      setCurrentRound(1);
    }
  }, [isDrawing, lobby.currentRound]);

  // Timer logic
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only start timers for drawing and word picking states
    if (
      (lobby.gameState === GAME_STATE.DRAWING ||
        lobby.gameState === GAME_STATE.PICKING_WORD) &&
      lobby.startTime
    ) {
      // If server provides timeLeft directly, use it for initial value
      if (lobby.timeLeft !== undefined) {
        setTimeLeft(lobby.timeLeft);
      } else {
        // Calculate from startTime
        const elapsed = (Date.now() - lobby.startTime) / 1000;
        const remaining = Math.max(0, Math.round(lobby.roundTime - elapsed));
        setTimeLeft(remaining);
      }

      // Check if this is a new timer
      const isNewTimer = lobby.startTime !== lastStartTimeRef.current;
      if (isNewTimer) {
        lastStartTimeRef.current = lobby.startTime;

        // Start new countdown timer
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

  // Calculate the width of the timer bar based on the time left
  const getTimerWidth = () => {
    if (lobby.gameState === GAME_STATE.DRAWING) {
      return (timeLeft / lobby.roundTime) * 100;
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      return (timeLeft / WORD_SELECTION_TIME) * 100;
    }
    return 100;
  };

  // Calculate the current reveal percentage based on time elapsed
  const getCurrentRevealPercentage = () => {
    if (!lobby.revealCharacters || lobby.gameState !== GAME_STATE.DRAWING)
      return 0;

    // Calculate time elapsed as a percentage of total round time
    const timeElapsedPercent =
      ((lobby.roundTime - timeLeft) / lobby.roundTime) * 100;

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
        .join("\u00A0\u00A0\u00A0"); // Join with 3 non-breaking spaces for wider spacing
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

  const renderWordSelection = () => {
    if (lobby.gameState === GAME_STATE.PICKING_WORD && isDrawing) {
      let wordChoices = [];
      // Check all possible sources of word choices in priority order
      if (Array.isArray(lobby.words) && lobby.words.length > 0) {
        // Option 1: Use the words array if available
        wordChoices = lobby.words;
        console.log("Using lobby.words array:", wordChoices);
      } else if (
        typeof lobby.currentWord === "string" &&
        lobby.currentWord.includes(",")
      ) {
        // Option 2: Parse from comma-separated currentWord
        wordChoices = lobby.currentWord
          .split(",")
          .map((word) => word.trim())
          .filter((word) => word.length > 0);
        // console.log("Parsed from currentWord:", wordChoices);
      } else if (
        typeof lobby.currentWord === "string" &&
        lobby.currentWord &&
        !lobby.currentWord.includes(",")
      ) {
        // Option 3: Single word in currentWord - might be in drawing state already
        console.log(
          "Single word found in currentWord - might be in drawing state already"
        );
      } else {
        // No words found
        console.log("No word options found in any expected location");
      }

      // If we have no word choices but we're in picking_word state and we're the drawer,
      // create mock choices from the word lists as fallback
      if (wordChoices.length === 0 && lobby.selectWord > 0) {
        console.log("Creating fallback word choices");
        // You could add code to generate random word choices here if needed
      }

      // Use the appropriate number of choices based on lobby settings
      const maxChoices = Math.min(
        lobby.selectWord || 3, // Default to 3 if selectWord is not defined
        wordChoices.length
      );
      const selectedWords = wordChoices.slice(0, maxChoices);

      if (
        selectedWords.length === 0 ||
        lobby.selectWord !== selectedWords.length
      ) {
        console.warn(
          "No word options available or mismatch in selection count"
        );
        return null;
      }

      return (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {selectedWords.length > 0 ? (
            selectedWords.map((wordOption, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log(`Selected word: ${wordOption}`);
                  onWordPick(wordOption);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
              >
                {wordOption}
              </button>
            ))
          ) : (
            <p>No word options available. Please wait...</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="hiddenWord"
      className="flex flex-col items-center justify-center p-3 bg-white/95 dark:bg-gray-700/85 rounded-lg shadow-lg transition-colors"
    >
      <div className="text-2xl font-mono tracking-wider text-gray-800 dark:text-gray-200">
        {getMaskedWord()}
      </div>

      <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mt-2">
        {getStatusText()}
      </div>

      <div className="w-full h-2 mt-3 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
          style={{
            width: `${getTimerWidth()}%`,
          }}
        />
      </div>

      {/* Word selection options */}
      {renderWordSelection()}
    </div>
  );
};

export default HiddenWord;
