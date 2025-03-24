import React, { useEffect, useState } from "react";

import { GAME_STATE } from "../../../../shared/constants";

const HiddenWord = ({
  word,
  isDrawing,
  isRevealing,
  gameState,
  timeLeft,
  rounds,
  maxRounds,
}) => {
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [showWordReveal, setShowWordReveal] = useState(false);

  useEffect(() => {
    // Reset revealed indices when a new word is chosen
    setRevealedIndices([]);
  }, [word]);

  useEffect(() => {
    if (isRevealing && gameState === GAME_STATE.DRAWING && !isDrawing && word) {
      const wordLength = word.length;
      // Calculate what percentage of non-space characters to reveal
      const revealPercentage = isRevealing / 100; // Convert from 0-100 to 0-1
      const nonSpaceChars = word.replace(/\s/g, "").length;
      const charsToReveal = Math.ceil(nonSpaceChars * revealPercentage);

      // Don't set up timer if reveal rate is 0%
      if (revealPercentage <= 0) return;

      // Calculate interval - distribute reveals across 80% of the round time
      // This ensures most letters are revealed before time runs out
      const totalTime = 60; // round time in seconds
      const revealTime = totalTime * 0.8; // use 80% of the round time for reveals
      const interval = revealTime / charsToReveal;

      const timer = setInterval(() => {
        setRevealedIndices((prev) => {
          // If we've already revealed enough characters, don't reveal more
          if (prev.length >= charsToReveal) {
            clearInterval(timer);
            return prev;
          }

          const availableIndices = Array.from(
            { length: wordLength },
            (_, i) => i
          ).filter((i) => !prev.includes(i) && word[i] !== " ");

          if (availableIndices.length > 0) {
            const randomIndex =
              availableIndices[
                Math.floor(Math.random() * availableIndices.length)
              ];
            return [...prev, randomIndex];
          }
          return prev;
        });
      }, interval * 1000);

      return () => clearInterval(timer);
    }
  }, [isRevealing, word, gameState, isDrawing]);

  useEffect(() => {
    if (timeLeft === 0 || gameState !== GAME_STATE.DRAWING) {
      // If the game is finished or time is up, show the word reveal
      setShowWordReveal(true);
      // Hide the reveal after 3 seconds if not in FINISHED state
      if (gameState !== GAME_STATE.FINISHED) {
        setTimeout(() => setShowWordReveal(false), 3000);
      }
    }
  }, [timeLeft, gameState]);

  const getMaskedWord = () => {
    if (!word) return "";
    if (showWordReveal || gameState === GAME_STATE.FINISHED) {
      return word;
    }
    return word
      .split("")
      .map((char, index) => {
        if (char === " ") return " ";
        return revealedIndices.includes(index) ? char : "_";
      })
      .join(" ");
  };

  return (
    <div className="flex items-center text-gray-900 dark:text-gray-100 justify-center h-24 w-full bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-4 transition-colors relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center">
        <div className="text-sm font-semibold">Round</div>
        <div className="text-lg font-bold">
          {rounds}/{maxRounds}
        </div>
      </div>

      <div className="text-center">
        {(() => {
          if (gameState === GAME_STATE.PICKING_WORD) {
            if (isDrawing) {
              return <p>Pick a word!</p>;
            } else {
              return (
                <p className="text-2xl font-mono tracking-wider">
                  The drawer is picking a word...
                </p>
              );
            }
          }
          if (gameState === GAME_STATE.DRAW_END) {
            return (
              <div>
                <p className="text-2xl font-mono tracking-wider">
                  The drawer has finished drawing! The word was:
                </p>
                <p className="text-3xl font-bold mt-2">{word}</p>
                <p className="text-sm mt-2 dark:text-gray-300">
                  Waiting for the next round...
                </p>
              </div>
            );
          }

          if (gameState === GAME_STATE.ROUND_END) {
            return (
              <div>
                <p className="text-2xl font-mono tracking-wider">
                  Everyon has drawn! Let's see the results!
                </p>
                <p className="text-sm mt-2 dark:text-gray-300">
                  Waiting for the next round...
                </p>
              </div>
            );
          }

          if (gameState === GAME_STATE.GAME_END) {
            return (
              <div>
                <p className="text-2xl font-mono tracking-wider">
                  The game has ended! Here are the results:
                </p>
              </div>
            );
          }

          if (gameState === GAME_STATE.DRAWING) {
            return (
              <div>
                {isDrawing ? (
                  <p>Draw the word: {word}</p>
                ) : (
                  <>
                    <p className="text-2xl font-mono tracking-wider">
                      {getMaskedWord()}
                    </p>
                    {showWordReveal && (
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 dark:bg-gray-800/90 text-white p-6 rounded-lg shadow-xl z-50 animate-fade-in">
                        <p className="text-xl">The word was:</p>
                        <p className="text-3xl font-bold mt-2">{word}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default HiddenWord;
