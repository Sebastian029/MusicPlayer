import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/ThemeContext";
import { usePlayer } from "../hooks/PlayerContext";
import ModalScreen from "./ModalScreen";

export default function PlaylistEditor({ playlist, onClose }) {
  const { theme } = useTheme();
  const { songs, savePlaylist, deletePlaylist } = usePlayer();
  const [name, setName] = useState(playlist.name);
  const [songIds, setSongIds] = useState(playlist.song_ids);

  const moveSong = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= songIds.length) {
      return;
    }
    const newIds = [...songIds];
    const moved = newIds[index];
    newIds[index] = newIds[target];
    newIds[target] = moved;
    setSongIds(newIds);
  };

  const removeSong = (index) => {
    setSongIds(songIds.filter((_, songIndex) => songIndex !== index));
  };

  const save = async () => {
    if (!name.trim()) {
      return;
    }
    await savePlaylist({ id: playlist.id, name, song_ids: songIds });
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert("Delete playlist?", playlist.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePlaylist(playlist.id);
          onClose();
        },
      },
    ]);
  };

  const renderSong = (songId, index) => {
    const song = songs.find((item) => item.id === songId);
    if (!song) {
      return null;
    }
    return (
      <View key={songId} style={[styles.row, { borderColor: theme.track }]}>
        <View style={styles.songText}>
          <Text numberOfLines={1} style={[styles.songName, { color: theme.text }]}>
            {song.name}
          </Text>
          <Text numberOfLines={1} style={{ color: theme.muted }}>
            {song.artist}
          </Text>
        </View>
        <Ionicons
          name="arrow-up"
          style={[styles.icon, { color: theme.text }]}
          onPress={() => moveSong(index, -1)}
        />
        <Ionicons
          name="arrow-down"
          style={[styles.icon, { color: theme.text }]}
          onPress={() => moveSong(index, 1)}
        />
        <Ionicons
          name="close"
          style={[styles.icon, { color: theme.danger }]}
          onPress={() => removeSong(index)}
        />
      </View>
    );
  };

  return (
    <ModalScreen onClose={onClose}>
      <TextInput
        style={[
          styles.nameInput,
          { color: theme.text, borderColor: theme.track },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Playlist name"
        placeholderTextColor={theme.muted}
      />
      <ScrollView style={styles.list}>
        {songIds.length === 0 && (
          <Text style={[styles.empty, { color: theme.muted }]}>
            Empty playlist. Long-press a song in the list to add it.
          </Text>
        )}
        {songIds.map(renderSong)}
      </ScrollView>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={[styles.button, { color: theme.danger }]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.button, { color: theme.muted }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save}>
          <Text style={[styles.button, { color: theme.accent }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1.5,
    paddingVertical: 8,
    marginBottom: 12,
  },
  list: { flex: 1 },
  empty: { textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  songText: { flex: 1 },
  songName: { fontSize: 16, fontWeight: "bold" },
  icon: { fontSize: 24, paddingHorizontal: 8 },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
  },
  button: { fontSize: 16, fontWeight: "bold", padding: 8 },
});
