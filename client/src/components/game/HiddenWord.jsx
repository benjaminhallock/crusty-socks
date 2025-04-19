import { useState, useEffect, useRef } from "react";

import { GAME_STATE, GAME_CONSTANTS } from "../../constants";

import Button from "../common/ui/Button";
const HiddenWord = ({ lobby, user, onWordPick }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [wordChoices, setWordChoices] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const timerRef = useRef(null);
  const lastTickRef = useRef(null);
  const animationFrameRef = useRef(null);

  const WORD_SELECTION_TIME = GAME_CONSTANTS.WORD_SELECTION_TIME || 30; // Default to 30 seconds if not defined
  const [currentRound, setCurrentRound] = useState(lobby.currentRound || 1);

  // Use the user prop directly to determine if this user is the drawer
  const isDrawing = user?.username === lobby.currentDrawer;

  useEffect(() => {
    if (isDrawing) {
      setCurrentRound(lobby.currentRound);
    }
  }, [isDrawing, lobby.currentRound]);

  const updateTimer = (timestamp) => {
    if (!lastTickRef.current) {
      lastTickRef.current = timestamp;
    }

    const elapsed = timestamp - lastTickRef.current;
    if (elapsed >= 1000) {
      // Update every second
      const currentTime = Date.now();
      let newTimeLeft = 0;

      if (lobby.gameState === GAME_STATE.DRAWING && lobby.startTime) {
        const startTime = new Date(lobby.startTime).getTime();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        newTimeLeft = Math.max(0, lobby.roundTime - elapsedSeconds);
      } else if (
        lobby.gameState === GAME_STATE.PICKING_WORD &&
        lobby.startTime
      ) {
        const startTime = new Date(lobby.startTime).getTime();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        newTimeLeft = Math.max(0, WORD_SELECTION_TIME - elapsedSeconds);
      }

      setTimeLeft(newTimeLeft);
      lastTickRef.current = timestamp;
    }

    if (timeLeft > 0) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Skip timer setup for non-active states
    if (
      lobby.gameState !== GAME_STATE.DRAWING &&
      lobby.gameState !== GAME_STATE.PICKING_WORD
    ) {
      return;
    }

    // Calculate initial time left
    const currentTime = Date.now();
    let initialTimeLeft = 0;

    if (lobby.gameState === GAME_STATE.DRAWING && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      initialTimeLeft = Math.max(0, lobby.roundTime - elapsedSeconds);
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      initialTimeLeft = Math.max(0, WORD_SELECTION_TIME - elapsedSeconds);
    }

    setTimeLeft(initialTimeLeft);
    lastTickRef.current = null;

    if (initialTimeLeft > 0) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [lobby.gameState, lobby.startTime, lobby.roundTime]);

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
      // Smoother animation by using decimal points
      const percentage = (timeLeft / lobby.roundTime) * 100;
      return Math.max(0, Math.min(100, percentage)).toFixed(1);
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      const percentage = (timeLeft / WORD_SELECTION_TIME) * 100;
      return Math.max(0, Math.min(100, percentage)).toFixed(1);
    }
    return 100;
  };

  // Get timer bar color based on time remaining
  const getTimerColor = () => {
    if (lobby.gameState !== GAME_STATE.DRAWING) {
      return "bg-indigo-400";
    }
    if (timeLeft <= 10) {
      return "bg-red-400 animate-pulse";
    }
    if (timeLeft <= 30) {
      return "bg-amber-400";
    }
    return "bg-emerald-400";
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
        isDrawing
          ? "Choose your word!"
          : `Waiting for word ${lobby.currentDrawer} to choose...`
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
    <div className="flex flex-col items-center justify-center py-2 px-4 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-700/95 dark:to-gray-800/95 rounded-lg shadow-md">
      {/* Word Display and Status Section */}
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="relative">
          <div className="text-2xl font-mono tracking-[0.5em] text-gray-800 dark:text-gray-200 min-h-[1.25em] text-center">
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
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/4 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />
          )}
        </div>

        {/* Compact Timer Bar */}
        <div className="w-full max-w-xl mt-2">
          <div
            className="relative h-2 bg-gray-200 dark:bg-gray-600 overflow-hidden"
            style={{ imageRendering: "pixelated" }}
          >
            <div
              className={`absolute h-full ${getTimerColor()}`}
              style={{
                width: `${getTimerWidth()}%`,
                backgroundImage:
                  "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 100%)",
                backgroundSize: "4px 100%",
              }}
            />
          </div>
        </div>

        {/* Compact Status Text */}
        <div className="text-sm font-medium mt-1 text-gray-600 dark:text-gray-300">
          {/* {lobby.gameState && lobby.gameState !== GAME_STATE.WAITING
            ? `Game state: ${lobby.gameState
                .replace(/_/g, " ")
                .toLowerCase()}  |    `
            : ""} */}
          {getStatusText()}
        </div>
      </div>

      {/* Word Selection Buttons - Single Row */}
      {lobby.gameState === GAME_STATE.PICKING_WORD && isDrawing && (
        <div className="mt-3 flex flex-row justify-center gap-2 w-full max-w-2xl">
          {wordChoices
            .slice(0, lobby.selectWord || 3)
            .map((wordOption, index) => (
              <Button
                variant="secondary"
                key={index}
                onClick={() => onWordPick(wordOption)}
                size="md"
              >
                {wordOption}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};

export default HiddenWord;
