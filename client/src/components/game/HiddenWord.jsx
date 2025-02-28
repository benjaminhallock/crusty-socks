import React, { useEffect, useState } from "react";

import { GAME_STATE } from "../../../../shared/constants";

const HiddenWord = ({ word, isDrawing, isRevealing, gameState, timeLeft, rounds, maxRounds }) => {
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [showWordReveal, setShowWordReveal] = useState(false);

  useEffect(() => {
    if (isRevealing && gameState === GAME_STATE.DRAWING && !isDrawing) {
      const wordLength = word.length;
      const interval = Math.floor(60 / (wordLength * 0.7)); // Reveal 70% of letters over 60s
      
      const timer = setInterval(() => {
        setRevealedIndices(prev => {
          const availableIndices = Array.from({ length: wordLength }, (_, i) => i)
            .filter(i => !prev.includes(i) && word[i] !== ' ');
          
          if (availableIndices.length > 0) {
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            return [...prev, randomIndex];
          }
          return prev;
        });
      }, interval * 1000);

      return () => clearInterval(timer);
    }
  }, [isRevealing, word, gameState, isDrawing]);

  useEffect(() => {
    if (timeLeft === 0 || gameState === GAME_STATE.FINISHED) {
      setShowWordReveal(true);
      // Hide the reveal after 3 seconds if not in FINISHED state
      if (gameState !== GAME_STATE.FINISHED) {
        setTimeout(() => setShowWordReveal(false), 3000);
      }
    }
  }, [timeLeft, gameState]);

  const getMaskedWord = () => {
    if (!word) return '';
    if (showWordReveal || gameState === GAME_STATE.FINISHED) {
      return word;
    }
    return word.split('').map((char, index) => {
      if (char === ' ') return ' ';
      return revealedIndices.includes(index) ? char : '_'
    }).join(' ');
  };

  return (
    <div className="flex items-center text-gray-900 dark:text-gray-100 justify-center h-24 w-full bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-4 transition-colors relative">
      {/* Round tracker */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center">
        <div className="text-sm font-semibold">Round</div>
        <div className="text-lg font-bold">{rounds}/{maxRounds}</div>
      </div>

      <div className="text-center">
        {gameState === GAME_STATE.WAITING && <p>Waiting for players...</p>}

        {gameState === GAME_STATE.PICKING_WORD &&
          (isDrawing ? (
            <p>Pick a word!</p>
          ) : (
            <p>The drawer is picking a word!</p>
          ))}

        {gameState === GAME_STATE.DRAWING && (
          <div>
            {isDrawing ? (
              <p>Draw the word: {word}</p>
            ) : (
              <>
                <p className="text-2xl font-mono tracking-wider">{getMaskedWord()}</p>
                {showWordReveal && (
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/90 dark:bg-gray-800/90 text-white p-6 rounded-lg shadow-xl z-50 animate-fade-in">
                    <p className="text-xl">The word was:</p>
                    <p className="text-3xl font-bold mt-2">{word}</p>
                  </div>
                )}
              </>
            )}
            {!showWordReveal && (
              <p className={`text-sm mt-2 ${timeLeft <= 10 ? 'text-red-500 dark:text-red-400 font-bold animate-pulse' : 'dark:text-gray-300'}`}>
                Time left: {timeLeft}s
              </p>
            )}
          </div>
        )}

        {gameState === GAME_STATE.FINISHED && (
          <div>
            <p className="dark:text-gray-300">Game Over!</p>
            <p className="text-xl font-bold mt-2">Final word: {word}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiddenWord;
