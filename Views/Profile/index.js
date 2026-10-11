import React from "react";
import { Text, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";
import { useTheme } from "../../hooks/ThemeContext";
import { usePlayer } from "../../hooks/PlayerContext";
import { darkTheme } from "../../themes";
import styles from "./styles";

const Row = ({ label, value, theme }) => (
  <View style={styles.row}>
    <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    <Text style={[styles.value, { color: theme.muted }]}>{value}</Text>
  </View>
);

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { songs, error } = usePlayer();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.text }]}>Settings</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>
            Dark theme
          </Text>
          <Switch
            value={theme === darkTheme}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.track, true: theme.accent }}
            thumbColor={theme.dark ? theme.text : theme.background}
          />
        </View>
        <Row label="Songs in library" value={songs.length} theme={theme} />
        <Row label="Server" value={API_URL} theme={theme} />
        <Row
          label="Connection"
          value={error ? "offline" : "ok"}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
};

export default Profile;
