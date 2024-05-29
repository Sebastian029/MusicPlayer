import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Button,
  SafeAreaView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
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

const flaskServerURL = "http://192.168.0.177:5000";

const App = ({ navigation }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState(null);
  

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

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <FlatList
          data={mediaFiles}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Player", { name: item.name })}
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
      </View>
    </SafeAreaView>
  );
};

export default App;
