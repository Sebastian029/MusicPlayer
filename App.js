import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import TabNav from "./Navigation/TabNav";

import { ThemeProvider } from "./hooks/ThemeContext";
import { FavoritesProvider } from "./hooks/FavoritesContext";
import { PlayerProvider } from "./hooks/PlayerContext";

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <PlayerProvider>
          <NavigationContainer>
            <TabNav />
          </NavigationContainer>
        </PlayerProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
