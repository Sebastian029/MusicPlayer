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
import AddToPlaylistModal from "../../components/AddToPlaylistModal";
import PlaylistEditor from "../../components/PlaylistEditor";

const Home = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { songs, myPlaylists, loading, error, loadSongs, playSong, current } =
    usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [editing, setEditing] = useState(false);

  const folder = route.params?.folder;
  const myPlaylist = myPlaylists.find(
    (playlist) => playlist.id === route.params?.myPlaylistId
  );
  const selectedName = myPlaylist ? myPlaylist.name : folder;

  const getPlaylistSongs = () => {
    if (myPlaylist) {
      return myPlaylist.song_ids
        .map((songId) => songs.find((song) => song.id === songId))
        .filter((song) => song);
    }
    if (folder) {
      return songs.filter((song) => song.playlist === folder);
    }
    return songs;
  };
  const playlistSongs = getPlaylistSongs();

  const showAllSongs = () => {
    navigation.setParams({ folder: undefined, myPlaylistId: undefined });
  };

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
            Cannot connect to the server: {error}
          </Text>
          <TouchableOpacity onPress={loadSongs}>
            <Text style={[styles.retry, { color: theme.text }]}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <Text style={[styles.emptyText, { color: theme.muted }]}>
        {onlyFavorites ? "No favorite songs" : "No songs"}
      </Text>
    );
  };

  const renderSong = ({ item: song }) => (
    <TouchableOpacity
      onPress={() => openSong(song)}
      onLongPress={() => setSongToAdd(song)}
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
              { borderColor: theme.track },
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
        {selectedName && (
          <View style={styles.selectedRow}>
            <Text
              numberOfLines={1}
              style={[styles.selectedName, { color: theme.text }]}
            >
              {selectedName}
            </Text>
            {myPlaylist && (
              <Ionicons
                name="create-outline"
                style={[styles.selectedIcon, { color: theme.text }]}
                onPress={() => setEditing(true)}
              />
            )}
            <Ionicons
              name="close"
              style={[styles.selectedIcon, { color: theme.muted }]}
              onPress={showAllSongs}
            />
          </View>
        )}
        <FlatList
          data={visibleSongs}
          keyExtractor={(song) => String(song.id)}
          renderItem={renderSong}
          refreshing={loading}
          onRefresh={loadSongs}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      </View>
      <AddToPlaylistModal song={songToAdd} onClose={() => setSongToAdd(null)} />
      {editing && myPlaylist && (
        <PlaylistEditor
          playlist={myPlaylist}
          onClose={() => setEditing(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default Home;
