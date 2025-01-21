export const wordColors = {
  sun: '#FFD700',
  tree: '#228B22',
  sky: '#87CEEB',
  ocean: '#0077BE',
  flower: '#FF69B4',
  apple: '#FF0000',
  grass: '#90EE90',
  cloud: '#F0F8FF',
  banana: '#FFE135',
  forest: '#228B22',
  fire: '#FF4500',
  snow: '#FFFAFA',
  rain: '#6495ED',
  mountain: '#8B4513',
  beach: '#F4A460',
  // Add more words with their associated colors
};

export const getWordColor = (word) => {
  return wordColors[word.toLowerCase()] || '#000000'; // Default to black if word not found
};
