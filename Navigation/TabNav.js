import * as React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet } from "react-native";
import Blur, { BlurView } from "expo-blur";

import TabIcon from "../components/TabIcon";
import Home from "../Views/Home/index";
import Player from "../Views/Player";

const optionScreen = {
  headerShown: false,
};

const Tab = createBottomTabNavigator();

export default function TabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          return <TabIcon routeName={route?.name} focused={focused} />;
        },
        tabBarLabel: ({ focused }) => {
          return (
            <Text style={{ color: focused ? "blue" : "gray" }}>
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
    </Tab.Navigator>
  );
}
