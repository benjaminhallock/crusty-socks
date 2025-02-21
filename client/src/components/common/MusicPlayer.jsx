import React, { useEffect, useRef } from 'react';

const tracks = [
  '/audio/testTrack1.mp3',
  '/audio/testTrack2.mp3',
  '/audio/testTrack3.mp3'
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
      console.log(`Now Playing Track: ${tracks[nextTrackIndex]}`);
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

    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    const savedTrackIndex = localStorage.getItem('currentTrackIndex');
    const savedTime = localStorage.getItem('currentTime');

    if (savedTrackIndex !== null) {
      lastTrackIndexRef.current = parseInt(savedTrackIndex, 10);
      audio.src = tracks[lastTrackIndexRef.current];
      audio.currentTime = savedTime ? parseFloat(savedTime) : 0;
      console.log(`Now Playing Track: ${tracks[lastTrackIndexRef.current]}`);
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Autoplay prevented:', error);
        });
      }
    } else {
      playRandomTrack();
    }

    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.currentTime = 0; // Reset to the beginning of the track
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
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return <audio ref={audioRef} />;
};

export default MusicPlayer;
