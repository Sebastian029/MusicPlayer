import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/ThemeContext";
import { usePlayer } from "../hooks/PlayerContext";
import ModalScreen from "./ModalScreen";

export default function NewPlaylistModal({ onCreated, onClose }) {
  const { theme } = useTheme();
  const { createPlaylist } = usePlayer();
  const [name, setName] = useState("");

  const create = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    const playlist = await createPlaylist(trimmedName);
    if (playlist) {
      onCreated(playlist);
    }
    onClose();
  };

  return (
    <ModalScreen onClose={onClose}>
      <Text style={[styles.header, { color: theme.text }]}>
        New playlist
      </Text>
      <TextInput
        autoFocus
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.track },
        ]}
        placeholder="Playlist name"
        placeholderTextColor={theme.muted}
        value={name}
        onChangeText={setName}
        onSubmitEditing={create}
      />
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.button, { color: theme.muted }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={create}>
          <Text style={[styles.button, { color: theme.accent }]}>Create</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, { color: theme.muted }]}>
        Add songs by long-pressing them in Home.
      </Text>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  input: {
    fontSize: 18,
    borderBottomWidth: 1.5,
    paddingVertical: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 24,
  },
  button: { fontSize: 16, fontWeight: "bold", padding: 8 },
  hint: { marginTop: 24 },
});
