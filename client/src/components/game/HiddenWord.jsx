import React from 'react';

const HiddenWord = () => {
  return (
    <div id="hiddenWord" className="w-full p-2 bg-gray-200 rounded-lg shadow text-center">
      <div className="text-sm font-medium text-gray-600">
        TAKE A GUESS
      </div>
      <div className="text-xl font-semibold text-gray-800 mt-1">
        hidden word will be here
      </div>
    </div>
  );
};

export default HiddenWord;
