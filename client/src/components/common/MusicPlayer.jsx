import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const tracks = [
  "/audio/pixelPartyMainTheme1.mp3",
  "/audio/drawASubmarine2.mp3",
  // "/audio/testTrack3.mp3",
];

const MusicPlayer = ({ isPlaying, musicVolume = 1, sfxVolume = 1 }, ref) => {
  const audioRef = useRef(null);
  const testSoundRef = useRef(new Audio("/audio/sfx/correct.mp3"));
  const lastTrackIndexRef = useRef(null);

  // Handle music volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = musicVolume;
    }
  }, [musicVolume]);

  // Handle SFX volume changes
  useEffect(() => {
    testSoundRef.current.volume = sfxVolume; // Remove isMuted logic
  }, [sfxVolume]);

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    playTestSound,
  }));

  const playTestSound = () => {
    testSoundRef.current.currentTime = 0;
    testSoundRef.current.play().catch(console.error);
  };

  const playRandomTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    let nextTrackIndex;
    do {
      nextTrackIndex = Math.floor(Math.random() * tracks.length);
    } while (nextTrackIndex === lastTrackIndexRef.current);

    lastTrackIndexRef.current = nextTrackIndex;
    audio.src = tracks[nextTrackIndex];
    audio.volume = musicVolume;
    console.log(`Now Playing Track: ${tracks[nextTrackIndex]}`);
    audio.play().catch((error) => console.error("Autoplay prevented:", error));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTrackEnd = () => setTimeout(playRandomTrack, 3000);

    audio.addEventListener("ended", handleTrackEnd);
    return () => audio.removeEventListener("ended", handleTrackEnd);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (!audio.src) playRandomTrack();
      else
        audio
          .play()
          .catch((error) => console.error("Autoplay prevented:", error));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <audio ref={audioRef} />
    </>
  );
};

export default forwardRef(MusicPlayer);
