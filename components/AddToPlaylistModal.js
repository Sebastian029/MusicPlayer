import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/ThemeContext";
import { usePlayer } from "../hooks/PlayerContext";
import ModalScreen from "./ModalScreen";

export default function AddToPlaylistModal({ song, onClose }) {
  const { theme } = useTheme();
  const { myPlaylists, createPlaylist, savePlaylist } = usePlayer();
  const [newName, setNewName] = useState("");

  if (!song) {
    return null;
  }

  const addToPlaylist = async (playlist) => {
    if (!playlist.song_ids.includes(song.id)) {
      await savePlaylist({
        ...playlist,
        song_ids: [...playlist.song_ids, song.id],
      });
    }
    onClose();
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }
    const playlist = await createPlaylist(name);
    setNewName("");
    if (playlist) {
      await addToPlaylist(playlist);
    }
  };

  return (
    <ModalScreen onClose={onClose}>
      <Text style={[styles.header, { color: theme.text }]}>
        Add to playlist
      </Text>
      <Text numberOfLines={1} style={[styles.songName, { color: theme.muted }]}>
        {song.artist} - {song.name}
      </Text>
      <ScrollView style={styles.list}>
        {myPlaylists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            onPress={() => addToPlaylist(playlist)}
            style={[styles.row, { borderColor: theme.track }]}
          >
            <Text style={[styles.rowText, { color: theme.text }]}>
              {playlist.name}
            </Text>
            <Text style={{ color: theme.muted }}>
              {playlist.song_ids.includes(song.id)
                ? "already added"
                : `${playlist.song_ids.length} ${
                    playlist.song_ids.length === 1 ? "song" : "songs"
                  }`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[styles.newRow, { borderColor: theme.track }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="New playlist..."
          placeholderTextColor={theme.muted}
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity onPress={createAndAdd}>
          <Text style={[styles.action, { color: theme.accent }]}>Create</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onClose}>
        <Text style={[styles.close, { color: theme.muted }]}>Close</Text>
      </TouchableOpacity>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "bold" },
  songName: { marginTop: 4, marginBottom: 16 },
  list: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: { fontSize: 16 },
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 16,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  action: { fontSize: 16, fontWeight: "bold" },
  close: { textAlign: "center", fontSize: 16, padding: 16 },
});
