import { useEffect, useRef } from 'react';

const tracks = [
  '/audio/pixelPartyMainTheme1.mp3',
  '/audio/testTrack2.mp3',
  '/audio/testTrack3.mp3'
];

const MusicPlayer = ({ isPlaying, isMuted }) => {
  const audioRef = useRef(null);
  const lastTrackIndexRef = useRef(null);

  const playRandomTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    let nextTrackIndex;
    do {
      nextTrackIndex = Math.floor(Math.random() * tracks.length);
    } while (nextTrackIndex === lastTrackIndexRef.current);

    lastTrackIndexRef.current = nextTrackIndex;
    audio.src = tracks[nextTrackIndex];
    console.log(`Now Playing Track: ${tracks[nextTrackIndex]}`);
    audio.play().catch((error) => console.error('Autoplay prevented:', error));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTrackEnd = () => setTimeout(playRandomTrack, 3000);

    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (!audio.src) playRandomTrack();
      else audio.play().catch((error) => console.error('Autoplay prevented:', error));
    } 
    else {
      audio.pause();
    }
  }, [isPlaying]);

  return <audio ref={audioRef} />;
};

export default MusicPlayer;