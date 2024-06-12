import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Button,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Audio } from "expo-av";
import styles from "./styles";
import WaveForms from "../../components/Waveforms/Waveforms";
import { getWaveForms } from "../../components/Waveforms/utils";
import MaskedView from "@react-native-masked-view/masked-view";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TapGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { STICK_FULL_WIDTH } from "../../components/Waveforms/constants";
import { useTheme } from "../../hooks/ThemeContext";

const flaskServerURL = "http://192.168.0.177:5000";

const App = ({ navigation }) => {
  const { theme } = useTheme();

  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch(`${flaskServerURL}/media_files`);
      const data = await response.json();
      setMediaFiles(data);
    } catch (error) {
      setError("Error fetching media files: " + error.message);
    }
  };

  const filteredMediaFiles = mediaFiles.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ height: "100%", backgroundColor: theme.background }}>
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View
          style={[
            styles.searchBar,
            { borderWidth: 2, borderColor: theme.primary },
          ]}
        >
          <TextInput
            style={[styles.searchBar, { color: theme.primary }]}
            placeholder="Search by name or artist..."
            placeholderTextColor="gray"
            onChangeText={(text) => setSearchQuery(text)}
            value={searchQuery}
          />
        </View>
        <FlatList
          data={filteredMediaFiles}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Player", {
                  paramId: item.id,
                  paramName: item.name,
                })
              }
              style={styles.itemContainer}
            >
              {item.image && (
                <Image
                  source={{ uri: `${flaskServerURL}/${item.image}` }}
                  style={styles.image}
                />
              )}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.primary }]}>
                  {item.name}
                </Text>
                <Text style={{ color: "gray", fontSize: 12 }}>
                  {item.artist}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default App;
