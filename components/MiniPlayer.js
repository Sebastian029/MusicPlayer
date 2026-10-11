import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/ThemeContext";
import { usePlayer } from "../hooks/PlayerContext";

const TAB_BAR_HEIGHT = 49;

export default function MiniPlayer({ navigation, bottomInset }) {
  const { theme } = useTheme();
  const { current, isPlaying, togglePlay, playNext } = usePlayer();

  if (!current) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate("Player")}
      style={[
        styles.container,
        {
          bottom: TAB_BAR_HEIGHT + bottomInset,
          backgroundColor: theme.surface,
          borderColor: theme.track,
        },
      ]}
    >
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {current.name}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: theme.muted }]}>
          {current.artist}
        </Text>
      </View>
      <Ionicons
        name={isPlaying ? "pause" : "play"}
        style={[styles.icon, { color: theme.accent }]}
        onPress={togglePlay}
      />
      <Ionicons
        name="play-skip-forward"
        style={[styles.icon, { color: theme.text }]}
        onPress={playNext}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: "bold" },
  artist: { fontSize: 12 },
  icon: { fontSize: 26, paddingHorizontal: 10 },
});
