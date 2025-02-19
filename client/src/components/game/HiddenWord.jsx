import React, { useEffect, useState } from "react";
import { GAME_STATE } from "../../../../shared/constants";

const HiddenWord = ({ word, isDrawing, isRevealing, gameState }) => {
  return (
    <div className="flex items-center text-black justify-center h-24 w-full bg-white rounded-lg shadow-lg p-4">
      {gameState === GAME_STATE.WAITING && <p>Waiting for players...</p>}

      {gameState === GAME_STATE.PICKING_WORD &&
        (isDrawing ? (
          <p>Pick a word!</p>
        ) : isRevealing ? (
          <p>The drawer is picking a word!</p>
        ) : null)}

      {gameState === GAME_STATE.DRAWING &&
        (isDrawing ? <p>Draw the word: {word}</p> : <p>Guess the word!</p>)}

      {gameState === GAME_STATE.FINISHED && <p>The word was: {word}</p>}
    </div>
  );
};

export default HiddenWord;
