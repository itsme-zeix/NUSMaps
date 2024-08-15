import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import * as Location from "expo-location";
import { StatusBar } from "react-native";
import { Text, View } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Inter-Bold": require("../assets/fonts/Inter-Bold.otf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.otf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.otf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  // Uncomment to clear existing database for testing
  // AsyncStorage.clear();

  // One time setup for async storage
  useEffect(() => {
    const setupLocalStorage = async () => {
      try {
        const isInitialized = await AsyncStorage.getItem("isInitialized");
        const lastUpdated = await AsyncStorage.getItem("lastUpdated");
        if (!isInitialized) {
          // Perform API call to retrieve database
          const response = await axios.get(`https://nusmaps.onrender.com/busStopDatabase?lastUpdated=${lastUpdated}`);
          if (response.status !== 200) {
            throw new Error("Network response was not ok. Please try again later.");
          }
          const busStops = await response.data;

          // Add `isFavorited` field to each bus stop
          const busStopsWithFavourite = busStops.map((busStop: any) => ({
            ...busStop,
            isFavourited: false,
          }));

          await AsyncStorage.setItem("busStops", JSON.stringify(busStopsWithFavourite));
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

  // REQUEST LOCATION PERMISSIONS
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  useEffect(() => {
    const requestLocationPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync(); //could be slow for ios

      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setPermissionErrorMsg("Permission to access location was denied.");
      }
    };

    requestLocationPermissions();
  }, []);
  useEffect(() => {
    if (permissionErrorMsg) {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please enable location permissions for NUSMaps.",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

  // Setting the status bar to dark colour requires a delay due to a known bug (see: https://github.com/expo/expo/issues/2813)
  const delay = (fun: any, timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout)).then(fun);
  const closePreview = () => {
    delay(() => StatusBar.setBarStyle("dark-content"), 3);
  };
  closePreview();

  return (
    <>
      <StatusBar />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="singularbusstop" />
      </Stack>
      <Toast />
    </>
  );
}
