import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import TabNav from "./Navigation/TabNav";

import { ThemeProvider } from "./hooks/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <TabNav />
      </NavigationContainer>
    </ThemeProvider>
  );
}
