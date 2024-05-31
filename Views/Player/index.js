import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { Text, View, Button, SafeAreaView, Image } from "react-native";
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
import { Feather, Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../hooks/ThemeContext";
import { STICK_FULL_WIDTH } from "../../components/Waveforms/constants";
import { BARS_NUM } from "../../components/Waveforms/constants";

const flaskServerURL = "http://192.168.0.177:5000";

const Player = ({ route }) => {
  const { paramId = 1, paramName = "" } = route.params || {};
  const { theme } = useTheme();
  const [id, setId] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wave, setWave] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [position, setPosition] = useState(0);
  const [sound, setSound] = useState(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(0);
  const [soundLoaded, setSoundLoaded] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setName(paramName);
    setId(paramId);
  }, [paramName, paramId]);

  useEffect(() => {
    setSound(null);
    fetchDuration();
    fetchMP3();
    fetchWaveform();
    fetchCoverPhoto();
    fetchName();

    return () => {
      if (sound) {
        sound.unloadAsync();
        setSoundLoaded(false);
      }
      clearInterval(intervalRef.current);
    };
  }, [id]);

  useEffect(() => {
    panX.value = 0;
  }, [soundLoaded]);

  const fetchName = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/get_name/${id}`);
      const data = await response.json();
      console.log(data.name);
      setName(data.name);
    } catch (error) {
      console.error("Error fetching MP3 name data:", error);
    }
  };
  const fetchDuration = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/get_duration/${id}`);
      const data = await response.json();
      setDuration(Math.floor(data.duration));
    } catch (error) {
      console.error("Error fetching MP3 duration data:", error);
    }
  };

  const fetchMP3 = async () => {
    let response;
    try {
      response = await fetch(`${flaskServerURL}/get_mp3/${id}`);
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
      const waveforms = await getWaveForms(flaskServerURL, id);
      setWave(waveforms);
    } catch (error) {
      console.error("Error fetching waveforms data:", error);
    }
  };

  const fetchCoverPhoto = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/get_cover/${id}`);
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
      //  if (status.durationMillis > 100)
      //   setDuration(Math.floor(status.durationMillis / 1000));
      setSoundLoaded(true);
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  };

  const playMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.playAsync();
        playing.value = true;
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  };

  const pauseMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.pauseAsync();
        playing.value = false;
        setIsPlaying(false);
        //   clearInterval(intervalRef.current);
      } catch (error) {
        console.error("Error pausing sound:", error);
      }
    }
  };

  const stopMP3 = async () => {
    if (soundLoaded) {
      try {
        await sound.stopAsync();
        playing.value = false;
        //   setPosition(0); // Reset position when stopped
        //   clearInterval(intervalRef.current);
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
    }
  };

  const seekMP3 = useCallback(
    async (bar) => {
      //console.log((bar / BARS_NUM) * duration);
      if (soundLoaded) {
        try {
          await sound.playFromPositionAsync((bar / BARS_NUM) * duration * 1000);
          playing.value = true;
        } catch (error) {
          console.error("Error seeking sound:", error);
        }
      }
    },
    [soundLoaded, sound]
  );

  const playing = useSharedValue(false);
  const sliding = useSharedValue(false);
  const tapGesture = Gesture.Tap().onEnd(() => {
    playing.value = !playing.value;
  });

  const panX = useSharedValue(0);
  const maxPanX = -Math.round(STICK_FULL_WIDTH * BARS_NUM);
  const offsetX = useSharedValue(0);
  const segmentIndex = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      updateProgress();
    }, BARS_NUM / 220);

    return () => clearInterval(interval);
  }, []);

  const updateProgress = () => {
    "worklet";
    setPosition(
      Math.floor(
        (Math.round(-panX.value / STICK_FULL_WIDTH) / BARS_NUM) * 220
      )
    );
    if (playing.value && panX.value > maxPanX) {
      panX.value = withTiming(panX.value - STICK_FULL_WIDTH);
    }
  };
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
      segmentIndex.value = Math.round(-panX.value / STICK_FULL_WIDTH);
      runOnJS(seekMP3)(segmentIndex.value);
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

  useAnimatedReaction(
    () => playing.value,
    () => {
      if (playing.value) {
        runOnJS(playMP3)();
      } else {
        runOnJS(pauseMP3)();
      }
    }
  );

  const nextSong = () => {
    stopMP3();
    setId(id + 1);
  };
  const previousSong = () => {
    stopMP3();
    if (id - 1 > 0) setId(id - 1);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.mainContainer}>
        <Text style={styles.topText}>Now Playing</Text>
        {coverImage && (
          <View style={styles.shadowContainer}>
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          </View>
        )}
        <Text style={styles.songTitle}>{name}</Text>
      </View>

      {wave && (
        <GestureHandlerRootView style={{ height: "25%" }}>
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
                      width: "1000%",
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
                          backgroundColor: theme.primary,
                        },
                        playedAnimatedStyle,
                      ]}
                    />
                    <View
                      style={{ flex: 1, backgroundColor: theme.card }}
                    ></View>
                  </MaskedView>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      )}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: theme.primary }]}>
          {formatTime(position)}
        </Text>
        <Text style={[styles.timeText, { color: theme.card }]}>
          {formatTime(duration)}
        </Text>
      </View>
      <View style={styles.bottomContainer}>
        <Ionicons name="shuffle" style={[styles.icon, { color: theme.card }]} />
        <Ionicons
          name="play-skip-back"
          style={[styles.icon, { color: theme.primary }]}
          onPress={previousSong}
        />
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          style={[styles.iconLarge, { color: theme.primary }]}
          onPress={() => (playing.value = !playing.value)}
          disabled={!soundLoaded}
        />

        <Ionicons
          name="play-skip-forward"
          style={[styles.icon, { color: theme.primary }]}
          onPress={nextSong}
        />
        <Ionicons name="repeat" style={[styles.icon, { color: theme.card }]} />
      </View>
    </SafeAreaView>
  );
};

export default Player;
