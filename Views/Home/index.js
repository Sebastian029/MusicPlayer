import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Button,
  SafeAreaView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import styles from "./styles";

const flaskServerURL = "http://192.168.0.177:5000/";

const App = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

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

  const playMP3 = async (path) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({
        uri: `${flaskServerURL}/${path}`,
      });
      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setError("Error playing MP3 file: " + error.message);
    }
  };

  const stopMP3 = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      setError("Error stopping MP3 file: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={mediaFiles}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => playMP3(item.path)}
            style={styles.itemContainer}
          >
            {item.image && (
              <Image
                source={{ uri: `${flaskServerURL}/${item.image}` }}
                style={styles.image}
              />
            )}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {isPlaying && <Button title="Stop" onPress={stopMP3} />}
    </SafeAreaView>
  );
};

export default App;
