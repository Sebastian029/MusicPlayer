import React from "react";
import { StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../hooks/ThemeContext";

const TabIcon = ({ routeName, focused }) => {
  const { theme } = useTheme();
  const iconColor = focused ? theme.primary : theme.card;
  switch (routeName) {
    case "Home":
      return (
        <AntDesign
          name="home"
          style={[styles.icon, { color: theme.primary }]}
        />
      );

    case "Player":
      return (
        <FontAwesome name="music" style={[styles.icon, { color: iconColor }]} />
      );
    case "Profile":
      return (
        <AntDesign name="user" style={[styles.icon, { color: iconColor }]} />
      );

    default:
      return (
        <AntDesign
          name="unknowfile1"
          style={[styles.icon, { color: iconColor }]}
        />
      );
  }
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
  },
});

export default TabIcon;
