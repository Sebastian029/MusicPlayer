import React, { useEffect, useState } from "react";
import { Text, View, FlatList, TouchableOpacity, Button } from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

const App = () => {
  const [mp3Files, setMp3Files] = useState([]);
  const [sound, setSound] = useState();

  useEffect(() => {
    const setupDirectory = async () => {
      try {
        const directory = FileSystem.documentDirectory + "audio/";
        const directoryInfo = await FileSystem.getInfoAsync(directory);

        if (!directoryInfo.exists) {
          await FileSystem.makeDirectoryAsync(directory, {
            intermediates: true,
          });
        }

        // Simulate adding a sample MP3 file for demonstration purposes
        const sampleMp3Uri = FileSystem.documentDirectory + "audio/sample.mp3";
        const sampleMp3Exists = await FileSystem.getInfoAsync(sampleMp3Uri);

        if (!sampleMp3Exists.exists) {
          // Copy a sample MP3 file from assets to the directory
          const { uri: assetUri } = await FileSystem.downloadAsync(
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Example MP3 URL
            sampleMp3Uri
          );
          console.log("Sample MP3 file added at:", assetUri);
        }

        const files = await FileSystem.readDirectoryAsync(directory);
        const mp3Files = files.filter((file) => file.endsWith(".mp3"));
        setMp3Files(mp3Files);
      } catch (error) {
        console.error("Error setting up directory:", error);
      }
    };

    setupDirectory();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playSound = async (fileUri) => {
    try {
      console.log("Loading Sound:", fileUri);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true } // Automatically play the sound once it's loaded
      );
      setSound(newSound);
      console.log("asd");
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            console.log("Playback finished");
            newSound.unloadAsync();
          }
        } else if (status.error) {
          console.log("Playback error:", status.error);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

  const renderMp3Item = ({ item }) => {
    const fileUri = FileSystem.documentDirectory + "audio/" + item;
    return (
      <View style={{ margin: 10 }}>
        <Text>{item}</Text>
        <Button title="Play" onPress={() => playSound(fileUri)} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>List of MP3 Files:</Text>
      <FlatList
        data={mp3Files}
        renderItem={renderMp3Item}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default App;
