import { useCallback } from 'react';

const sounds = {
  draw: new Audio('/sounds/draw.mp3'),
  correct: new Audio('/sounds/correct.mp3'),
  roundStart: new Audio('/sounds/round-start.mp3'),
  roundEnd: new Audio('/sounds/round-end.mp3'),
};

export const useSoundEffects = () => {
  const playSound = useCallback((soundName) => {
    const sound = sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }, []);

  return { playSound };
};
