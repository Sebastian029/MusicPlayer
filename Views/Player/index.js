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
function findNearestMultiple(n, multiple) {
  "worklet";
  return Math.floor(n / multiple) * multiple;
}

const Player = ({ route }) => {
  const { name } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [wave, setWave] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [sound, setSound] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    fetchMP3();
    fetchWaveform();
    fetchCoverPhoto();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playMP3 = async () => {
    try {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const pauseMP3 = async () => {
    try {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error pausing sound:", error);
    }
  };

  const stopMP3 = async () => {
    try {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error stopping sound:", error);
    }
  };

  const fetchMP3 = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/get_mp3/${name}`);
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
      console.error("Error fetching MP3 data:", error);
    }
  };

  const loadSound = async (uri) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = newSound;
      setSound(newSound);
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  };

  const playing = useSharedValue(false);
  const sliding = useSharedValue(false);
  const tapGesture = Gesture.Tap().onEnd(() => {
    playing.value = !playing.value;
  });

  const updateProgress = () => {
    "worklet";
    if (playing.value && !sliding.value && panX.value > maxPanX) {
      panX.value = withTiming(panX.value - STICK_FULL_WIDTH);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => updateProgress(), 150);
    return () => clearInterval(interval);
  }, []);

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

  const dimensions = useWindowDimensions();
  const panX = useSharedValue(0);
  const maxPanX = -dimensions.width;
  const offsetX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const nextPanX = (panX.value = offsetX.value + event.translationX);
      sliding.value = true;
      if (nextPanX > 0) {
        panX.value = 0;
      } else if (nextPanX < maxPanX) {
        panX.value = maxPanX;
      } else {
        panX.value = nextPanX;
      }
    })
    .onEnd(() => {
      offsetX.value = findNearestMultiple(panX.value, STICK_FULL_WIDTH);
      sliding.value = false;
    });

  const maskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
  }));

  const playedAnimatedStyle = useAnimatedStyle(() => ({
    width: -panX.value,
  }));

  const handlePlayPause = useCallback((isPlaying) => {
    if (isPlaying) {
      playMP3();
    } else {
      pauseMP3();
    }
  }, []);

  useAnimatedReaction(
    () => playing.value,
    (isPlaying) => {
      runOnJS(handlePlayPause)(isPlaying);
    }
  );
  return (
    <SafeAreaView style={{ height: "100%" }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Text>{name}</Text>
        {coverImage && (
          <Image
            source={{ uri: coverImage }}
            style={{ width: 200, height: 200 }}
          />
        )}
      </View>
      <Button
        title={isPlaying ? "Pause" : "Play"}
        onPress={isPlaying ? pauseMP3 : playMP3}
      />
      <Button title="Stop" onPress={stopMP3} />
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
    </SafeAreaView>
  );
};

export default Player;
