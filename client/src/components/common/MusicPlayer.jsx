import React, { useEffect, useRef } from 'react';

const tracks = [
  './audio/testTrack1.mp3',
  './audio/testTrack2.mp3',
  './audio/testTrack3.mp3'
];

const MusicPlayer = ({ isPlaying, isMuted }) => {
  const audioRef = useRef(null);
  const lastTrackIndexRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playRandomTrack = () => {
      let nextTrackIndex;
      do {
        nextTrackIndex = Math.floor(Math.random() * tracks.length);
      } while (nextTrackIndex === lastTrackIndexRef.current);

      lastTrackIndexRef.current = nextTrackIndex;
      audio.src = tracks[nextTrackIndex];
      console.log(`Playing track: ${tracks[nextTrackIndex]}`);
      audio.play().catch(error => {
        console.error('Autoplay prevented:', error);
      });
    };

    const handleTrackEnd = () => {
      setTimeout(playRandomTrack, 4000); // 4-second delay between tracks
      localStorage.setItem('currentTrackIndex', lastTrackIndexRef.current);
      localStorage.setItem('currentTime', 0);
    };

    const handleTimeUpdate = () => {
      localStorage.setItem('currentTime', audio.currentTime);
    };

    const handleUserInteraction = () => {
      document.removeEventListener('click', handleUserInteraction);
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Autoplay prevented:', error);
        });
      }
    };

    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    const savedTrackIndex = localStorage.getItem('currentTrackIndex');
    const savedTime = localStorage.getItem('currentTime');

    if (savedTrackIndex !== null) {
      lastTrackIndexRef.current = parseInt(savedTrackIndex, 10);
      audio.src = tracks[lastTrackIndexRef.current];
      audio.currentTime = savedTime ? parseFloat(savedTime) : 0;
      console.log(`Resuming track: ${tracks[lastTrackIndexRef.current]} from ${audio.currentTime}s`);
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Autoplay prevented:', error);
          document.addEventListener('click', handleUserInteraction);
        });
      }
    } else {
      playRandomTrack();
      if (isPlaying) {
        document.addEventListener('click', handleUserInteraction);
      }
    }

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch(error => {
        console.error('Autoplay prevented:', error);
        document.addEventListener('click', () => {
          audio.play().catch(err => console.error('Autoplay prevented:', err));
        });
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return <audio ref={audioRef} />;
};

export default MusicPlayer;
