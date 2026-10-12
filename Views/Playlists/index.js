import React, { useState } from "react";
import {
  Image,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { API_URL } from "../../config";
import { useTheme } from "../../hooks/ThemeContext";
import { usePlayer } from "../../hooks/PlayerContext";
import NewPlaylistModal from "../../components/NewPlaylistModal";
import PlaylistEditor from "../../components/PlaylistEditor";

const Playlists = ({ navigation }) => {
  const { theme } = useTheme();
  const { playlists, myPlaylists } = usePlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editedPlaylist, setEditedPlaylist] = useState(null);

  const query = searchQuery.toLowerCase();
  const matchesSearch = (playlist) =>
    playlist.name.toLowerCase().includes(query);

  const sections = [
    {
      title: "My playlists",
      emptyText: "No playlists of your own yet",
      data: myPlaylists.filter(matchesSearch).map((playlist) => ({
        key: `mine-${playlist.id}`,
        name: playlist.name,
        count: playlist.song_ids.length,
        myPlaylist: playlist,
      })),
    },
    {
      title: "Folders and albums",
      emptyText: "No folders",
      data: playlists.filter(matchesSearch).map((playlist) => ({
        key: `folder-${playlist.name}`,
        name: playlist.name,
        count: playlist.count,
        image: playlist.image,
        folder: playlist.name,
      })),
    },
  ];

  const openPlaylist = (item) => {
    navigation.navigate("Home", {
      folder: item.folder,
      myPlaylistId: item.myPlaylist?.id,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => openPlaylist(item)}
      style={styles.itemContainer}
    >
      {item.image ? (
        <Image
          source={{ uri: `${API_URL}/${item.image}` }}
          style={styles.image}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.imagePlaceholder,
            { backgroundColor: theme.surface },
          ]}
        >
          <Ionicons
            name="musical-notes"
            style={[styles.placeholderIcon, { color: theme.muted }]}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.count, { color: theme.muted }]}>
          {item.count} {item.count === 1 ? "song" : "songs"}
        </Text>
      </View>
      {item.myPlaylist && (
        <Ionicons
          name="create-outline"
          style={[styles.editIcon, { color: theme.text }]}
          onPress={() => setEditedPlaylist(item.myPlaylist)}
        />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.muted }]}>
        {section.title}
      </Text>
    </View>
  );

  const renderSectionFooter = ({ section }) => {
    if (section.data.length > 0) {
      return null;
    }
    return (
      <Text style={[styles.emptyText, { color: theme.muted }]}>
        {section.emptyText}
      </Text>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: theme.text }]}>Playlists</Text>
          <Ionicons
            name="add-circle-outline"
            style={[styles.addIcon, { color: theme.accent }]}
            onPress={() => setCreating(true)}
          />
        </View>
        <View style={[styles.searchBox, { borderColor: theme.track }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search playlists..."
            placeholderTextColor={theme.muted}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
        />
      </View>
      {creating && (
        <NewPlaylistModal
          onCreated={(playlist) =>
            navigation.navigate("Home", {
              folder: undefined,
              myPlaylistId: playlist.id,
            })
          }
          onClose={() => setCreating(false)}
        />
      )}
      {editedPlaylist && (
        <PlaylistEditor
          playlist={editedPlaylist}
          onClose={() => setEditedPlaylist(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default Playlists;
