import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

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

  // Uncomment to clear existing database for testing
  // AsyncStorage.clear();'

  // One time setup for async storage
  useEffect(() => {
    const setupLocalStorage = async () => {
      try {
        const isInitialized = await AsyncStorage.getItem("isInitialized");
        const lastUpdated = await AsyncStorage.getItem("lastUpdated");
        if (!isInitialized) {
          // Perform API call to retrieve database
          const response = await fetch(
            `https://nusmaps.onrender.com:3000/busStopDatabase?lastUpdated=${lastUpdated}`
          );
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const busStops = await response.json();
          console.log(busStops);
          let i = 0;
          // Add `isFavorited` field to each bus stop
          const busStopsWithFavourite = busStops.map((busStop) => ({
            ...busStop,
            isFavourited: i++ < 5,
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
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
      <Toast />
    </>
  );
}
