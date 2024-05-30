import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  Button,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from "react-native";
import { Audio } from "expo-av";
import styles from "./styles";
import WaveForms from "../../components/Waveforms/Waveforms";
import { getWaveForms } from "../../components/Waveforms/utils";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { STICK_FULL_WIDTH } from "../../components/Waveforms/constants";

const flaskServerURL = "http://192.168.0.177:5000";

const Player = ({ route }) => {
  const { name } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [wave, setWave] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [position, setPosition] = useState(0); // Track music position
  const [sound, setSound] = useState(null);
  const [duration, setDuration] = useState(0);
  const [soundLoaded, setSoundLoaded] = useState(false); // Track if sound is loaded
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMP3();
    fetchWaveform();
    fetchCoverPhoto();

    return () => {
      if (sound) {
        sound.unloadAsync();
        setSoundLoaded(false);
      }
      clearInterval(intervalRef.current);
    };
  }, [name]);

  const fetchMP3 = async () => {
    let response;
    try {
      response = await fetch(`${flaskServerURL}/get_mp3/${name}`);
      if (sound) {
        await sound.unloadAsync();
      }
      await loadSound(response.url);
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
      setSoundLoaded(true);
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  };

  const playMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.playAsync();
        setIsPlaying(true);
        intervalRef.current = setInterval(updatePosition, 1000); // Update position every second
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  };

  const pauseMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
        clearInterval(intervalRef.current);
      } catch (error) {
        console.error("Error pausing sound:", error);
      }
    }
  };

  const stopMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
        setPosition(0); // Reset position when stopped
        clearInterval(intervalRef.current);
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
    }
  };

  const seekMP3 = useCallback(
    async (value) => {
      if (soundLoaded) {
        try {
          await sound.playFromPositionAsync(value * 1000);
        } catch (error) {
          console.error("Error seeking sound:", error);
        }
      }
    },
    [soundLoaded, sound]
  );

  const changePlaybackSpeed = useCallback(async () => {
    if (soundLoaded) {
      try {
        const newSpeed = isPlaying ? 2.0 : 1.0; // Toggle between 1x and 2x speed
        await sound.setRateAsync(newSpeed, true);
      } catch (error) {
        console.error("Error changing playback speed:", error);
      }
    }
  }, [soundLoaded, isPlaying, sound]);

  const onSliderValueChange = useCallback((value) => {
    setPosition(value);
  }, []);

  const onSlidingComplete = useCallback(
    async (value) => {
      if (soundLoaded) {
        try {
          const newPosition = value;
          setPosition(newPosition); // Update position state when the slider is released
          await seekMP3(newPosition); // Seek to the selected position
        } catch (error) {
          console.error("Error seeking sound:", error);
        }
      }
    },
    [soundLoaded, seekMP3]
  );

  const updatePosition = useCallback(async () => {
    if (soundLoaded && isPlaying) {
      const status = await sound.getStatusAsync();
      setPosition(status.positionMillis / 1000);
    }
  }, [soundLoaded, isPlaying, sound]);

  const forward10Seconds = useCallback(() => {
    if (soundLoaded) {
      const newPosition = position + 10;
      if (newPosition < duration / 1000) {
        seekMP3(newPosition);
      } else {
        seekMP3(duration / 1000 - 1); // Prevent overflow
      }
    }
  }, [soundLoaded, position, duration, seekMP3]);

  const playing = useSharedValue(false);
  const sliding = useSharedValue(false);
  const tapGesture = Gesture.Tap().onEnd(() => {
    playing.value = !playing.value;
  });

  const dimensions = useWindowDimensions();
  const segmentWidth = useSharedValue(0);

  useEffect(() => {
    segmentWidth.value = dimensions.width / (duration / 200); // Calculate segment width based on duration
  }, [dimensions.width, duration]);

  const panX = useSharedValue(0);
  const maxPanX = -dimensions.width;
  const offsetX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      sliding.value = true;
      const nextPanX = offsetX.value + event.translationX;
      if (nextPanX > 0) {
        panX.value = 0;
      } else if (nextPanX < maxPanX) {
        panX.value = maxPanX;
      } else {
        panX.value = nextPanX;
      }
    })
    .onEnd(() => {
      offsetX.value = panX.value;
      sliding.value = false;
      const segmentIndex = Math.round(-panX.value / segmentWidth.value);
      const newPosition = segmentIndex * 0.2; // 200ms corresponds to 0.2 seconds
      runOnJS(seekMP3)(newPosition); // Update music position based on waveform pan
    });

  const maskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
  }));

  const playedAnimatedStyle = useAnimatedStyle(() => ({
    width: -panX.value,
  }));

  const topWavesAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(playing.value ? 50 : 5),
    };
  });

  const bottomWavesAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(playing.value ? 40 : 4),
    };
  });

  const handlePlayPause = useCallback(
    (isPlaying) => {
      if (isPlaying) {
        playMP3();
      } else {
        pauseMP3();
      }
    },
    [soundLoaded]
  ); // Include soundLoaded as dependency

  useAnimatedReaction(
    () => playing.value,
    (isPlaying) => {
      runOnJS(handlePlayPause)(isPlaying);
    }
  );

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

      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Button
          title={isPlaying ? "Pause" : "Play"}
          onPress={isPlaying ? pauseMP3 : playMP3}
          disabled={!soundLoaded} // Disable buttons until sound is loaded
        />
        <Button title="Stop" onPress={stopMP3} disabled={!soundLoaded} />
        <Button
          title={isPlaying ? "2x Speed" : "1x Speed"}
          onPress={changePlaybackSpeed}
          disabled={!soundLoaded}
        />
        <Button
          title="Forward 10s"
          onPress={forward10Seconds}
          disabled={!soundLoaded}
        />
      </View>
      {wave && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GestureDetector gesture={tapGesture}>
            <Animated.View style={{ flex: 1 }}>
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[{ flex: 1 }, maskAnimatedStyle]}>
                  <MaskedView
                    maskElement={
                      <View style={styles.waveContainer}>
                        <Animated.View style={topWavesAnimatedStyle}>
                          <WaveForms waveForms={wave} />
                        </Animated.View>
                        <Animated.View style={bottomWavesAnimatedStyle}>
                          <WaveForms waveForms={wave} reversed />
                        </Animated.View>
                      </View>
                    }
                    style={{
                      marginLeft: "50%",
                      flex: 1,
                      width: "100%",
                    }}
                  >
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          zIndex: 1,
                          left: 0,
                          bottom: 0,
                          top: 0,
                          backgroundColor: "orange",
                        },
                        playedAnimatedStyle,
                      ]}
                    />
                    <View style={{ flex: 1, backgroundColor: "gray" }}></View>
                  </MaskedView>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      )}
      <View style={{ margin: 20 }}>
        <Text>
          Current Position: {Math.floor(position)}s /{" "}
          {Math.floor(duration / 1000)}s
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Player;
