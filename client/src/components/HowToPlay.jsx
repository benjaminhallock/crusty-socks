import { useState } from "react";

const HowToPlay = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
      >
        How to Play
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">
              How to Play Pixel Party
            </h2>
            <div className="space-y-3 mb-6 dark:text-gray-300">
              <p>🎨 One player is chosen to draw the given word</p>
              <p>🤔 Other players try to guess the word</p>
              <p>⏱️ Each round lasts 60 seconds</p>
              <p>📝 Type your guesses in the chat</p>
              <p>🎉 Points are awarded for correct guesses</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToPlay;
