import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  Button,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../hooks/ThemeContext";

const Profile = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={{ height: "100%", backgroundColor: theme.background }}>
      <Text>PROFILE</Text>
      <Button title="Theme" onPress={toggleTheme}></Button>
    </SafeAreaView>
  );
};

export default Profile;
