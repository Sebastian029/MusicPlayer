import React, { createContext, useContext, useEffect, useState } from "react";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { API_URL } from "../config";

const PlayerContext = createContext();
const PositionContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((error) => console.error("Error setting audio mode:", error));
    loadSongs();
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      handleSongEnd();
    }
  }, [status.didJustFinish]);

  const loadSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      const songsResponse = await fetch(`${API_URL}/media_files`);
      const playlistsResponse = await fetch(`${API_URL}/playlists`);
      if (!songsResponse.ok || !playlistsResponse.ok) {
        throw new Error("Serwer zwrócił błąd");
      }
      setSongs(await songsResponse.json());
      setPlaylists(await playlistsResponse.json());
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const playSong = (song, songQueue) => {
    if (songQueue) {
      setQueue(songQueue);
    }
    player.replace({ uri: `${API_URL}/get_mp3/${song.id}` });
    player.setActiveForLockScreen(true, {
      title: song.name,
      artist: song.artist,
      artworkUrl: song.image ? `${API_URL}/${song.image}` : undefined,
    });
    player.play();
    setCurrent(song);
  };

  const pickSong = (step) => {
    if (queue.length === 0) {
      return null;
    }
    const otherSongs = queue.filter((song) => song.id !== current?.id);
    if (shuffle && otherSongs.length > 0) {
      return otherSongs[Math.floor(Math.random() * otherSongs.length)];
    }
    const index = queue.findIndex((song) => song.id === current?.id);
    return queue[(index + step + queue.length) % queue.length];
  };

  const playNext = () => {
    const song = pickSong(1);
    if (song) {
      playSong(song);
    }
  };

  const playPrevious = () => {
    if (status.currentTime > 3) {
      player.seekTo(0);
      return;
    }
    const song = pickSong(-1);
    if (song) {
      playSong(song);
    }
  };

  const handleSongEnd = async () => {
    if (repeat) {
      await player.seekTo(0);
      player.play();
    } else {
      playNext();
    }
  };

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = (seconds) => {
    player.seekTo(seconds);
  };

  return (
    <PlayerContext.Provider
      value={{
        songs,
        playlists,
        loading,
        error,
        loadSongs,
        current,
        isPlaying: status.playing,
        repeat,
        shuffle,
        setRepeat,
        setShuffle,
        playSong,
        playNext,
        playPrevious,
        togglePlay,
        seekTo,
      }}
    >
      <PositionContext.Provider
        value={{ position: status.currentTime, duration: status.duration }}
      >
        {children}
      </PositionContext.Provider>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
export const usePosition = () => useContext(PositionContext);
