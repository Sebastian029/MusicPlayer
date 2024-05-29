import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Button,
  SafeAreaView,
  Image,
  TouchableOpacity,
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
  TapGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { STICK_FULL_WIDTH } from "../../components/Waveforms/constants";

const flaskServerURL = "http://192.168.0.177:5000";

const App = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wave, setWave] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/media_files`);
      const data = await response.json();
      setMediaFiles(data);
    } catch (error) {
      setError("Error fetching media files: " + error.message);
    }
  };

  const playMP3 = async (path, name) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({
        uri: `${flaskServerURL}/${path}`,
      });
      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      const waveforms = await getWaveForms(flaskServerURL, name);
      setWave(waveforms);
    } catch (error) {
      setError("Error playing MP3 file: " + error.message);
    }
  };

  const stopMP3 = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        setIsPlaying(false);
        setWave(null);
      }
    } catch (error) {
      setError("Error stopping MP3 file: " + error.message);
    }
  };
  const findNearestMultiple = (n, multiple) => {
    "worklet";
    return Math.floor(n / multiple) * multiple;
  };

  const playing = useSharedValue(false);
  const sliding = useSharedValue(false);
  const tapGesture = Gesture.Tap().onEnd(() => {
    playing.value = !playing.value;
    console.log("Tapped! Playing status:", playing.value);
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

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <FlatList
          data={mediaFiles}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => playMP3(item.path, item.name)}
              style={styles.itemContainer}
            >
              {item.image && (
                <Image
                  source={{ uri: `${flaskServerURL}/${item.image}` }}
                  style={styles.image}
                />
              )}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      {isPlaying && <Button title="Stop" onPress={stopMP3} />}
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

export default App;
