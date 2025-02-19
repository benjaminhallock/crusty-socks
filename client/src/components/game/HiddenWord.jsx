import React, { useEffect, useState } from "react";

const HiddenWord = ({ word, isDrawing, isRevealing }) => {
  const [revealedIndices, setRevealedIndices] = useState([]);

  useEffect(() => {
    if (!isDrawing && word && !isRevealing) {
      const interval = setInterval(() => {
        setRevealedIndices((prev) => {
          const remainingIndices = [...Array(word.length).keys()].filter(
            (i) => !prev.includes(i)
          );
          if (remainingIndices.length === 0) return prev;
          const randomIndex =
            remainingIndices[
              Math.floor(Math.random() * remainingIndices.length)
            ];
          return [...prev, randomIndex];
        });
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [word, isDrawing, isRevealing]);

  const getDisplayWord = () => {
    if (isDrawing) return word;
    if (!word) return "";
    return word
      .split("")
      .map((char, i) => (revealedIndices.includes(i) ? char : "_"))
      .join(" ");
  };

  return (
    <div
      id="hiddenWord"
      className="w-full p-1 bg-gray-200 rounded-lg shadow text-center"
    >
      <div className="text-xs font-medium text-gray-600">
        {isDrawing ? "Your word is: " + word : "Guess the word!"}
      </div>
      <div className="text-lg font-semibold text-gray-800 mt-0.5">
        {isDrawing ? word : getDisplayWord()}
      </div>
      {isRevealing && !isDrawing && (
        <div className="text-xs text-red-500 mt-1">The word was: {word}</div>
      )}
    </div>
  );
};

export default HiddenWord;
