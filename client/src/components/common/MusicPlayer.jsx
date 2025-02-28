import React, { useEffect, useRef } from 'react';

const tracks = [
  '/audio/testTrack1.mp3',
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
    audio.play().catch(error => {
      console.error('Autoplay prevented:', error);
    });
  };

  // Initial setup and track end handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTrackEnd = () => {
      setTimeout(playRandomTrack, 4000);
      localStorage.setItem('currentTrackIndex', lastTrackIndexRef.current);
      localStorage.setItem('currentTime', 0);
    };

    const handleTimeUpdate = () => {
      localStorage.setItem('currentTime', audio.currentTime);
    };

    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Resume from saved state or play random
    const savedTrackIndex = localStorage.getItem('currentTrackIndex');
    const savedTime = localStorage.getItem('currentTime');

    if (savedTrackIndex !== null) {
      lastTrackIndexRef.current = parseInt(savedTrackIndex, 10);
      audio.src = tracks[lastTrackIndexRef.current];
      audio.currentTime = savedTime ? parseFloat(savedTime) : 0;
      if (isPlaying) {
        audio.play().catch(error => console.error('Autoplay prevented:', error));
      }
    }

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []); // Only run on mount

  // Handle mute changes
  useEffect(() => {
    const audio = audioRef.current;
    audio.muted = isMuted;
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (!audio.src) {
        playRandomTrack();
      } else {
        audio.play().catch(error => console.error('Autoplay prevented:', error));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return <audio ref={audioRef} />;
};

export default MusicPlayer;