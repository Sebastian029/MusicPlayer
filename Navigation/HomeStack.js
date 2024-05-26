import React, { createContext, useContext, useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../Views/Home";

const Stack = createNativeStackNavigator();

export default function HomeStackNav() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
