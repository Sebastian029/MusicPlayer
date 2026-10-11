import React, { useEffect, useState } from "react";
import { Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles";
import WaveForms from "../../components/Waveforms/Waveforms";
import { getWaveForms } from "../../components/Waveforms/utils";
import { STICK_FULL_WIDTH } from "../../components/Waveforms/constants";
import { API_URL } from "../../config";
import { useTheme } from "../../hooks/ThemeContext";
import { usePlayer, usePosition } from "../../hooks/PlayerContext";
import { useFavorites } from "../../hooks/FavoritesContext";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const Player = () => {
  const { theme } = useTheme();
  const {
    current,
    isPlaying,
    repeat,
    shuffle,
    setRepeat,
    setShuffle,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
  } = usePlayer();
  const { position, duration } = usePosition();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [wave, setWave] = useState(null);
  const waveWidth = wave ? wave.bars.length * STICK_FULL_WIDTH : 0;
  const songDuration = wave && wave.duration > 0 ? wave.duration : duration;

  const panX = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const sliding = useSharedValue(false);
  const playing = useSharedValue(false);
  const waveWidthValue = useSharedValue(0);
  const songDurationValue = useSharedValue(0);

  useEffect(() => {
    if (!current) {
      return;
    }
    let isOutdated = false;
    setWave(null);
    panX.value = 0;
    offsetX.value = 0;
    getWaveForms(API_URL, current.id).then((waveforms) => {
      if (!isOutdated) {
        setWave(waveforms);
      }
    });
    return () => {
      isOutdated = true;
    };
  }, [current?.id]);

  useEffect(() => {
    playing.value = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    waveWidthValue.value = waveWidth;
    songDurationValue.value = songDuration;
  }, [waveWidth, songDuration]);

  useEffect(() => {
    if (sliding.value || !songDuration || !waveWidth) {
      return;
    }
    const played = Math.min(position / songDuration, 1);
    panX.value = withTiming(-played * waveWidth, {
      duration: 250,
      easing: Easing.linear,
    });
  }, [position, songDuration, waveWidth]);

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(togglePlay)();
  });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      offsetX.value = panX.value;
    })
    .onUpdate((event) => {
      sliding.value = true;
      const nextPanX = offsetX.value + event.translationX;
      panX.value = Math.min(0, Math.max(-waveWidthValue.value, nextPanX));
    })
    .onEnd(() => {
      sliding.value = false;
      const fraction = -panX.value / waveWidthValue.value;
      runOnJS(seekTo)(fraction * songDurationValue.value);
    })
    .onFinalize(() => {
      sliding.value = false;
    });

  const maskAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
  }));

  const playedAnimatedStyle = useAnimatedStyle(() => ({
    width: -panX.value,
  }));

  const topWavesAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(playing.value ? 50 : 5),
  }));

  const bottomWavesAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(playing.value ? 40 : 4),
  }));

  if (!current) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.empty, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.topText, { color: theme.text }]}>
          Wybierz utwór z listy Home
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.mainContainer}>
        {current.image && (
          <View style={[styles.coverFrame, { borderColor: theme.track }]}>
            <Image
              source={{ uri: `${API_URL}/${current.image}` }}
              style={styles.coverImage}
            />
          </View>
        )}
        <View style={styles.textBlock}>
          <Text
            numberOfLines={2}
            style={[styles.songTitle, { color: theme.text }]}
          >
            {current.name}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: theme.muted }]}>
            {current.artist}
          </Text>
        </View>
      </View>

      {waveWidth > 0 && (
        <GestureHandlerRootView style={styles.waveArea}>
          <GestureDetector gesture={tapGesture}>
            <Animated.View style={{ flex: 1 }}>
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[{ flex: 1 }, maskAnimatedStyle]}>
                  <MaskedView
                    maskElement={
                      <View style={styles.waveContainer}>
                        <Animated.View style={topWavesAnimatedStyle}>
                          <WaveForms waveForms={wave.bars} />
                        </Animated.View>
                        <Animated.View style={bottomWavesAnimatedStyle}>
                          <WaveForms waveForms={wave.bars} reversed />
                        </Animated.View>
                      </View>
                    }
                    style={{ marginLeft: "50%", flex: 1, width: waveWidth }}
                  >
                    <Animated.View
                      style={[
                        styles.playedPart,
                        { backgroundColor: theme.accent },
                        playedAnimatedStyle,
                      ]}
                    />
                    <View style={{ flex: 1, backgroundColor: theme.track }} />
                  </MaskedView>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      )}

      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: theme.text }]}>
          {formatTime(position)}
        </Text>
        <Text style={[styles.timeText, { color: theme.muted }]}>
          {formatTime(songDuration)}
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <Ionicons
          name="shuffle"
          style={[styles.icon, { color: shuffle ? theme.text : theme.muted }]}
          onPress={() => setShuffle(!shuffle)}
        />
        <Ionicons
          name="play-skip-back"
          style={[styles.icon, { color: theme.text }]}
          onPress={playPrevious}
        />
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          style={[styles.iconLarge, { color: theme.accent }]}
          onPress={togglePlay}
        />
        <Ionicons
          name="play-skip-forward"
          style={[styles.icon, { color: theme.text }]}
          onPress={playNext}
        />
        <Ionicons
          name="repeat"
          style={[styles.icon, { color: repeat ? theme.text : theme.muted }]}
          onPress={() => setRepeat(!repeat)}
        />
      </View>

      <View style={styles.favoriteContainer}>
        <Ionicons
          name={isFavorite(current) ? "heart" : "heart-outline"}
          style={[styles.icon, { color: theme.text }]}
          onPress={() => toggleFavorite(current)}
        />
      </View>
    </SafeAreaView>
  );
};

export default Player;
