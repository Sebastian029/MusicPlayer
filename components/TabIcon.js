import React from "react";
import { StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";

const TabIcon = ({ routeName, focused }) => {
  const iconColor = focused ? "blue" : "gray";

  switch (routeName) {
    case "Home":
      return (
        <AntDesign name="home" style={[styles.icon, { color: iconColor }]} />
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
