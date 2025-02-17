import React, { useEffect, useRef, useState } from 'react';

const tracks = [
  '/path/to/track1.mp3',
  '/path/to/track2.mp3',
  '/path/to/track3.mp3'
];

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const [lastTrackIndex, setLastTrackIndex] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playRandomTrack = () => {
      let nextTrackIndex;
      do {
        nextTrackIndex = Math.floor(Math.random() * tracks.length);
      } while (nextTrackIndex === lastTrackIndex);

      setLastTrackIndex(nextTrackIndex);
      audio.src = tracks[nextTrackIndex];
      audio.play();
    };

    audio.addEventListener('ended', playRandomTrack);
    playRandomTrack();

    return () => {
      audio.removeEventListener('ended', playRandomTrack);
    };
  }, [lastTrackIndex]);

  return <audio ref={audioRef} />;
};

export default MusicPlayer;
