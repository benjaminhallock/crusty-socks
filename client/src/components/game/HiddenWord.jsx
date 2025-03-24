import React, { useState, useEffect } from 'react';
import { GAME_STATE } from '../../../../shared/constants';
import { socketManager } from '../../services/socket';

const HiddenWord = ({ word, isDrawing, isRevealing, gameState, startTime, roundTime, rounds, maxRounds, roomId }) => {
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const WORD_SELECTION_TIME = 15; // 15 seconds to pick a word

  useEffect(() => {
    let intervalId;

    if (gameState === GAME_STATE.DRAWING && startTime) {
      const endTime = new Date(startTime).getTime() + (roundTime * 1000);
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(intervalId);
          socketManager.timeUp(roomId);
        }
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else if (gameState === GAME_STATE.PICKING_WORD && startTime) {
      const endTime = new Date(startTime).getTime() + (WORD_SELECTION_TIME * 1000);
      
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

  // Calculate timer width based on current game state
  const getTimerWidth = () => {
    if (gameState === GAME_STATE.DRAWING) {
      return (timeLeft / roundTime) * 100;
    } else if (gameState === GAME_STATE.PICKING_WORD) {
      return (timeLeft / WORD_SELECTION_TIME) * 100;
    }
    return 100;
  };

  // Helper function for deterministic letter reveals
  const getLetterRevealIndices = (word, revealPercentage) => {
    if (!word) return new Set();
    const letters = word.split('');
    const revealIndices = new Set();
    
    // Always reveal spaces
    letters.forEach((char, idx) => {
      if (char === ' ') revealIndices.add(idx);
    });

    // Use characters' charCode sum as a seed for deterministic reveals
    const wordSeed = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const positions = Array.from({ length: word.length }, (_, i) => i)
      .filter(i => !revealIndices.has(i))
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

  const getMaskedWord = () => {
    if (!word || gameState === GAME_STATE.WAITING || gameState === GAME_STATE.PICKING_WORD) {
      return '';
    }

    // Drawer always sees the full word
    if (isDrawing) {
      return word;
    }

    // At the end of drawing or end states, reveal the word
    if (gameState === GAME_STATE.END_DRAWING || 
        gameState === GAME_STATE.ROUND_END || 
        gameState === GAME_STATE.FINISHED) {
      return word;
    }

    // During drawing, show masked word with deterministic reveals
    if (gameState === GAME_STATE.DRAWING) {
      const letters = word.split('');
      const revealIndices = getLetterRevealIndices(word, isRevealing);

      return letters
        .map((char, idx) => revealIndices.has(idx) ? char : '_')
        .join(' ');
    }

    return '';
  };

  const getStatusText = () => {
    if (gameState === GAME_STATE.WAITING) {
      return 'Waiting for players...';
    }
    if (gameState === GAME_STATE.PICKING_WORD) {
      return isDrawing ? 'Choose your word!' : 'Waiting for word selection...';
    }
    if (gameState === GAME_STATE.DRAWING) {
      return `Time left: ${timeLeft}s`;
    }
    if (gameState === GAME_STATE.END_DRAWING) {
      return `Time's up! The word was: ${word}`;
    }
    if (gameState === GAME_STATE.ROUND_END) {
      return `Round ${rounds} of ${maxRounds} complete!`;
    }
    if (gameState === GAME_STATE.FINISHED) {
      return 'Game Over!';
    }
    return '';
  };

  return (
    <div id="hiddenWord" className="flex flex-col items-center justify-center p-4 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg transition-colors">
      <div className="text-2xl font-mono tracking-wider text-gray-800 dark:text-gray-200">
        {getMaskedWord()}
      </div>
      <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mt-2">
        {getStatusText()}
      </div>
      {(gameState === GAME_STATE.DRAWING || (gameState === GAME_STATE.PICKING_WORD && isDrawing)) && (
        <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${getTimerWidth()}%`,
              backgroundColor: gameState === GAME_STATE.PICKING_WORD ? '#F59E0B' : '#3B82F6'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HiddenWord;