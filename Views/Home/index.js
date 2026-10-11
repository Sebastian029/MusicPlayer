import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { API_URL } from "../../config";
import { useTheme } from "../../hooks/ThemeContext";
import { usePlayer } from "../../hooks/PlayerContext";
import { useFavorites } from "../../hooks/FavoritesContext";

const Home = ({ navigation }) => {
  const { theme } = useTheme();
  const { songs, playlists, loading, error, loadSongs, playSong, current } =
    usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const chips = [{ name: null }, ...playlists];

  const playlistSongs = selectedPlaylist
    ? songs.filter((song) => song.playlist === selectedPlaylist)
    : songs;

  const query = searchQuery.toLowerCase();
  const visibleSongs = playlistSongs.filter((song) => {
    const matchesSearch =
      song.name.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query);
    const matchesFavorites = !onlyFavorites || isFavorite(song);
    return matchesSearch && matchesFavorites;
  });

  const openSong = (song) => {
    playSong(song, playlistSongs);
    navigation.navigate("Player");
  };

  const renderEmpty = () => {
    if (loading) {
      return <ActivityIndicator color={theme.muted} size="large" />;
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.danger }]}>
            Nie można połączyć z serwerem: {error}
          </Text>
          <TouchableOpacity onPress={loadSongs}>
            <Text style={[styles.retry, { color: theme.text }]}>
              Spróbuj ponownie
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <Text style={[styles.emptyText, { color: theme.muted }]}>
        {onlyFavorites ? "Brak ulubionych utworów" : "Brak utworów"}
      </Text>
    );
  };

  const renderChip = ({ item: chip }) => {
    const selected = chip.name === selectedPlaylist;
    return (
      <TouchableOpacity
        onPress={() => setSelectedPlaylist(chip.name)}
        style={[
          styles.chip,
          {
            borderColor: selected ? theme.text : theme.track,
            backgroundColor: selected ? theme.text : theme.surface,
          },
        ]}
      >
        {chip.image && (
          <Image
            source={{ uri: `${API_URL}/${chip.image}` }}
            style={styles.chipImage}
          />
        )}
        <Text style={{ color: selected ? theme.background : theme.text }}>
          {chip.name || "Wszystkie"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSong = ({ item: song }) => (
    <TouchableOpacity
      onPress={() => openSong(song)}
      style={styles.itemContainer}
    >
      {song.image && (
        <Image
          source={{ uri: `${API_URL}/${song.image}` }}
          style={styles.image}
        />
      )}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: current?.id === song.id ? theme.accent : theme.text },
          ]}
        >
          {song.name}
        </Text>
        <Text style={[styles.artist, { color: theme.muted }]}>
          {song.artist}
        </Text>
      </View>
      <Ionicons
        name={isFavorite(song) ? "heart" : "heart-outline"}
        style={[styles.heart, { color: theme.text }]}
        onPress={() => toggleFavorite(song)}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              styles.searchBox,
              { borderWidth: 1.5, borderColor: theme.track },
            ]}
          >
            <TextInput
              style={[styles.searchBar, { color: theme.text }]}
              placeholder="Search by name or artist..."
              placeholderTextColor={theme.muted}
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
          <Ionicons
            name={onlyFavorites ? "heart" : "heart-outline"}
            style={[styles.filterIcon, { color: theme.text }]}
            onPress={() => setOnlyFavorites(!onlyFavorites)}
          />
        </View>
        <FlatList
          horizontal
          data={chips}
          keyExtractor={(chip) => String(chip.name)}
          renderItem={renderChip}
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
        />
        <FlatList
          data={visibleSongs}
          keyExtractor={(song) => String(song.id)}
          renderItem={renderSong}
          refreshing={loading}
          onRefresh={loadSongs}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingBottom: 76 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;
