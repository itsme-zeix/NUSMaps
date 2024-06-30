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

  // One time setup for async storage
  useEffect(() => {
    const setupData = async () => {
      const isInitialized = await AsyncStorage.getItem("isInitialized");
      const lastUpdated = await AsyncStorage.getItem("lastUpdated");
      if (!isInitialized) {
        // Perform API call to retrieve database
        const {
          isPending,
          error,
          data: busStops,
        } = useQuery({
          queryKey: ["busStopDatabase"],
          queryFn: () =>
            fetch(
              `http://localhost:3000/busStopsByLocation?latitude=${lastUpdated}`
            ).then((res) => res.json()),
        });

        await AsyncStorage.setItem("busStops", JSON.stringify(busStops));
        await AsyncStorage.setItem("isInitialized", "true");
      }
      if (isInitialized) {
        // perform updating of data by pinging rest api.
        // wait for implementation of last updated checks in backend?
        // doesn't quite make sense to pull the entire database every time the app boots.
      }
    };

    setupData();
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
