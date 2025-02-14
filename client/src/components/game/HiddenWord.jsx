import React from 'react';

const HiddenWord = () => {
  return (
    <div id="hiddenWord" className="w-full p-1 bg-gray-200 rounded-lg shadow text-center">
      <div className="text-xs font-medium text-gray-600">
        TAKE A GUESS
      </div>
      <div className="text-lg font-semibold text-gray-800 mt-0.5">
        hidden word will be here
      </div>
    </div>
  );
};

export default HiddenWord;
