import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
// MusicPlayer serves as the child of the Navbar

const tracks = [
  "/audio/pixelPartyMainTheme1.mp3",
  "/audio/drawASubmarine2.mp3",
  "/audio/getActive3.mp3"
];

const MusicPlayer = ({ isPlaying, musicVolume, sfxVolume }, ref) => {
  const audioRef = useRef(null);
  const testSoundRef = useRef(new Audio("/audio/sfx/correct.mp3")); // lightweight for a test sound
  const lastTrackIndexRef = useRef(null);
  // audioRef has to be declared as audio variable INSIDE of useEffects to handle the audio element re-rendering

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

  // Exposes playTestSound to Navbar
  useImperativeHandle(ref, () => ({
    playTestSound
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
    } while (nextTrackIndex === lastTrackIndexRef.current); // Avoid repeating the last track

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

    audio.addEventListener("ended", handleTrackEnd); // ended is a built-in event triggered by <audio> element in the DOM
    return () => audio.removeEventListener("ended", handleTrackEnd);
  }, []); // runs when the component mounts. Cleanup function removes event listener. 

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
