import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "react-native";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Forces dark status bar text (ignores device light/dark mode).
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
  }, []);

  // Uncomment to clear existing database for testing
  AsyncStorage.clear();

  // One time setup for async storage
  useEffect(() => {
    const setupLocalStorage = async () => {
      try {
        const isInitialized = await AsyncStorage.getItem("isInitialized");
        const lastUpdated = await AsyncStorage.getItem("lastUpdated");
        if (!isInitialized) {
          // Perform API call to retrieve database
          const response = await axios.get(
            `https://nusmaps.onrender.com/busStopDatabase?lastUpdated=${lastUpdated}`
          );
          if (response.status !== 200) {
            throw new Error(
              "Network response was not ok. Please try again later."
            );
          }
          const busStops = await response.data;

          // Add `isFavorited` field to each bus stop
          const busStopsWithFavourite = busStops.map((busStop: any) => ({
            ...busStop,
            isFavourited: false,
          }));

          await AsyncStorage.setItem(
            "busStops",
            JSON.stringify(busStopsWithFavourite)
          );
          await AsyncStorage.setItem("isInitialized", "true");
          console.log("ASYNC STORAGE INITIALIZED");
        } else {
          // Perform updating of data by pinging REST API.
          // Wait for implementation of last updated checks in backend.
          // It doesn't make sense to pull the entire database every time the app boots.
          console.log("ASYNC STORAGE HAS ALREADY BEEN INITIALIZED");
        }
      } catch (error) {
        console.error("Failed to setup local storage:", error);
      }
    };
    setupLocalStorage();
  }, []);

  // <Stack.Screen name="DetailedRoutingScreen" component={RouteCard}/>
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Toast />
    </>
  );
}
