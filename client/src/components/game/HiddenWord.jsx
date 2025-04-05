import { useState, useEffect } from "react";

import { GAME_STATE } from "../../constants";

// HiddenWord component displays the hidden word, timer, and game status
const HiddenWord = ({
  word,
  isDrawing,
  isRevealing,
  gameState,
  startTime,
  roundTime,
  rounds,
  maxRounds,
  roomId,
}) => {
  // State to manage the time left in the current round
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const WORD_SELECTION_TIME = 15; // Time (in seconds) to pick a word

  // Add state for current round
  const [currentRound, setCurrentRound] = useState(rounds || 1);

  // Update local round state when the `rounds` prop changes
  useEffect(() => {
    if (rounds !== undefined) {
      setCurrentRound(rounds || 1);
    }
  }, [rounds]);

  // Manage the timer based on the game state
  useEffect(() => {
    let intervalId;

    if (gameState === GAME_STATE.DRAWING && startTime) {
      const endTime = new Date(startTime).getTime() + roundTime * 1000;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(intervalId);
        }
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else if (gameState === GAME_STATE.PICKING_WORD && startTime) {
      const endTime =
        new Date(startTime).getTime() + WORD_SELECTION_TIME * 1000;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(roundTime);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState, startTime, roundTime, roomId]);

  // Calculate the width of the timer bar based on the time left
  const getTimerWidth = () => {
    if (gameState === GAME_STATE.DRAWING) {
      return (timeLeft / roundTime) * 100;
    } else if (gameState === GAME_STATE.PICKING_WORD) {
      return (timeLeft / WORD_SELECTION_TIME) * 100;
    }
    return 100;
  };

  // Calculate the current reveal percentage based on time elapsed
  const getCurrentRevealPercentage = () => {
    if (!isRevealing || gameState !== GAME_STATE.DRAWING) return 0;

    // Calculate time elapsed as a percentage of total round time
    const timeElapsedPercent = ((roundTime - timeLeft) / roundTime) * 100;

    // Scale the reveal percentage based on time elapsed and max reveal rate
    return Math.min(timeElapsedPercent * (isRevealing / 100), isRevealing);
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
      !word ||
      gameState === GAME_STATE.WAITING ||
      gameState === GAME_STATE.PICKING_WORD
    ) {
      return "";
    }

    // Drawer always sees the full word
    if (isDrawing) {
      return word;
    }

    // At the end of drawing or end states, reveal the word
    if (
      gameState === GAME_STATE.DRAW_END ||
      gameState === GAME_STATE.ROUND_END ||
      gameState === GAME_STATE.FINISHED
    ) {
      return word;
    }

    // During drawing, show masked word with gradual reveals
    if (gameState === GAME_STATE.DRAWING) {
      const letters = word.split("");
      // Get current reveal percentage based on elapsed time
      const currentRevealPercentage = getCurrentRevealPercentage();
      const revealIndices = getLetterRevealIndices(
        word,
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
      gameState !== GAME_STATE.WAITING
        ? `Round ${rounds || 1}/${maxRounds} - `
        : "";

    if (gameState === GAME_STATE.WAITING) {
      return "Waiting for players...";
    }
    if (gameState === GAME_STATE.PICKING_WORD) {
      return `${roundDisplay}${
        isDrawing ? "Choose your word!" : "Waiting for word selection..."
      }`;
    }
    if (gameState === GAME_STATE.DRAWING) {
      return `${roundDisplay}Time left: ${timeLeft}s`;
    }
    if (gameState === GAME_STATE.DRAW_END) {
      return `${roundDisplay}Time's up! The word was: ${word}`;
    }
    if (gameState === GAME_STATE.ROUND_END) {
      return `${roundDisplay}Round complete!`;
    }
    if (gameState === GAME_STATE.FINISHED) {
      return "Game Over!";
    }
    return "";
  };

  return (
    <div
      id="hiddenWord"
      className="flex flex-col items-center justify-center p-3 bg-white/95 dark:bg-gray-700/85 rounded-lg shadow-lg transition-colors"
    >
      <div className="text-2xl font-mono tracking-wider text-gray-800 dark:text-gray-200">
        {getMaskedWord()}
      </div>

      {/* Status text showing round and time */}
      <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mt-2">
        {getStatusText()}
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 mt-3 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
          style={{
            width: `${getTimerWidth()}%`,
          }}
        />
      </div>
    </div>
  );
};

export default HiddenWord;
