import * as React from "react";
import {
  createBottomTabNavigator,
  BottomTabBar,
} from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../hooks/ThemeContext";

import TabIcon from "../components/TabIcon";
import MiniPlayer from "../components/MiniPlayer";
import Home from "../Views/Home/index";
import Player from "../Views/Player";
import Profile from "../Views/Profile";

const optionScreen = {
  headerShown: false,
};

const Tab = createBottomTabNavigator();

const TabBar = (props) => {
  const activeTab = props.state.routes[props.state.index].name;

  return (
    <>
      {activeTab !== "Player" && (
        <MiniPlayer
          navigation={props.navigation}
          bottomInset={props.insets.bottom}
        />
      )}
      <BottomTabBar {...props} />
    </>
  );
};

export default function TabNav() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Tab.Navigator
        tabBar={TabBar}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => {
            return <TabIcon routeName={route?.name} focused={focused} />;
          },
          tabBarLabel: ({ focused }) => {
            return (
              <Text style={{ color: focused ? theme.accent : theme.muted }}>
                {route.name}
              </Text>
            );
          },
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.track,
            borderTopWidth: 1,
          },
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen name="Home" component={Home} options={optionScreen} />
        <Tab.Screen name="Player" component={Player} options={optionScreen} />
        <Tab.Screen name="Profile" component={Profile} options={optionScreen} />
      </Tab.Navigator>
    </>
  );
}
