import React, { useEffect, useState, useRef } from "react";
import { Text, View, Button, SafeAreaView, Image } from "react-native";
import { Audio } from "expo-av";
import styles from "./styles";
import WaveForms from "../../components/Waveforms/Waveforms";
import { getWaveForms } from "../../components/Waveforms/utils";
import Slider from "@react-native-community/slider";

const flaskServerURL = "http://192.168.0.177:5000";

const Player = ({ route }) => {
  const { name } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [wave, setWave] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [position, setPosition] = useState(0); // Track music position
  const [sound, setSound] = useState(null);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMP3();
    fetchWaveform();
    fetchCoverPhoto();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      clearInterval(intervalRef.current);
    };
  }, [name]); // Add `name` as a dependency to re-run the effect on navigation

  const fetchMP3 = async () => {
    let response;
    try {
      response = await fetch(`${flaskServerURL}/get_mp3/${name}`);
      if (sound) {
        await sound.unloadAsync(); // Unload the current sound before loading a new one
      }
      loadSound(response.url);
    } catch (error) {
      console.error("Error fetching MP3 data:", error);
    }
  };

  const fetchWaveform = async () => {
    try {
      const waveforms = await getWaveForms(flaskServerURL, name);
      setWave(waveforms);
    } catch (error) {
      console.error("Error fetching waveforms data:", error);
    }
  };

  const fetchCoverPhoto = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/get_cover/${name}`);
      setCoverImage(response.url);
    } catch (error) {
      console.error("Error fetching cover photo:", error);
    }
  };

  const loadSound = async (uri) => {
    try {
      const { sound: newSound, status } = await Audio.Sound.createAsync({
        uri,
      });
      setSound(newSound);
      setDuration(status.durationMillis);
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  };

  const playMP3 = async () => {
    try {
      await sound.playAsync();
      setIsPlaying(true);
      intervalRef.current = setInterval(updatePosition, 1000);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const pauseMP3 = async () => {
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
      clearInterval(intervalRef.current);
    } catch (error) {
      console.error("Error pausing sound:", error);
    }
  };

  const stopMP3 = async () => {
    try {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0); // Reset position when stopped
      clearInterval(intervalRef.current);
    } catch (error) {
      console.error("Error stopping sound:", error);
    }
  };

  const seekMP3 = async (value) => {
    try {
      await sound.playFromPositionAsync(value * 1000);
    } catch (error) {
      console.error("Error seeking sound:", error);
    }
  };

  const changePlaybackSpeed = async () => {
    try {
      const newSpeed = isPlaying ? 2.0 : 1.0; // Toggle between 1x and 2x speed
      await sound.setRateAsync(newSpeed, true);
    } catch (error) {
      console.error("Error changing playback speed:", error);
    }
  };

  const onSliderValueChange = (value) => {
    setPosition(value); // Update position state as the slider is moved
  };

  const onSlidingComplete = async (value) => {
    if (sound) {
      const newPosition = value;
      setPosition(newPosition); // Update position state when the slider is released
      await seekMP3(newPosition); // Seek to the selected position
    } else {
      console.error("Sound reference is not available.");
    }
  };

  const updatePosition = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          setPosition(status.positionMillis / 1000);
        }
      }
    } catch (error) {
      console.error("Error updating position:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <Text>{name}</Text>
        {coverImage && (
          <Image
            source={{ uri: coverImage }}
            style={{ width: 200, height: 200, marginTop: 10 }}
          />
        )}
      </View>
      <Slider
        style={{ width: "80%", alignSelf: "center" }}
        minimumValue={0}
        maximumValue={duration / 1000} // Duration in seconds
        value={position}
        onValueChange={onSliderValueChange}
        onSlidingComplete={onSlidingComplete}
      />
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Button
          title={isPlaying ? "Pause" : "Play"}
          onPress={isPlaying ? pauseMP3 : playMP3}
        />
        <Button title="Stop" onPress={stopMP3} />
        <Button
          title={isPlaying ? "2x Speed" : "1x Speed"}
          onPress={changePlaybackSpeed}
        />
      </View>
      {/* Rest of the code remains the same */}
    </SafeAreaView>
  );
};

export default Player;
