import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FavoritesContext = createContext();

const getKey = (song) => `${song.artist} - ${song.name}`;

export const FavoritesProvider = ({ children }) => {
  const [favoriteKeys, setFavoriteKeys] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem("favorites");
        if (saved) {
          setFavoriteKeys(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
      }
    };

    loadFavorites();
  }, []);

  const isFavorite = (song) => favoriteKeys.includes(getKey(song));

  const toggleFavorite = async (song) => {
    const key = getKey(song);
    const newKeys = isFavorite(song)
      ? favoriteKeys.filter((favoriteKey) => favoriteKey !== key)
      : [...favoriteKeys, key];
    setFavoriteKeys(newKeys);
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newKeys));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  };

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
