import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet } from "react-native";
import Blur, { BlurView } from "expo-blur";
import { useTheme } from "../hooks/ThemeContext";

import TabIcon from "../components/TabIcon";
import Home from "../Views/Home/index";
import Player from "../Views/Player";
import Profile from "../Views/Profile";

const optionScreen = {
  headerShown: false,
};

const Tab = createBottomTabNavigator();

export default function TabNav() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          return <TabIcon routeName={route?.name} focused={focused} />;
        },
        tabBarLabel: ({ focused }) => {
          return (
            <Text style={{ color: focused ? theme.primary : theme.card }}>
              {route.name}
            </Text>
          );
        },
        tabBarStyle: {
          position: "absolute",
        },
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            style={{
              ...StyleSheet.absoluteFillObject,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              overflow: "hidden",
              backgroundColor: "transparent",
            }}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={Home} options={optionScreen} />
      <Tab.Screen name="Player" component={Player} options={optionScreen} />
      <Tab.Screen name="Profile" component={Profile} options={optionScreen} />
    </Tab.Navigator>
  );
}
