import "dotenv/config";

export default {
  expo: {
    name: "NUSMaps",
    slug: "NUSMaps",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.NUSMaps",
      infoPlist: {
        UIBackgroundModes: ["location", "fetch", "remote-notification"],
        NSLocationWhenInUseUsageDescription: "This app requires access to your location when open.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app requires access to your location even when closed.",
        NSLocationAlwaysUsageDescription: "This app requires access to your location when open.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["android.permission.ACCESS_COARSE_LOCATION", "android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_BACKGROUND_LOCATION", "android.permission.FOREGROUND_SERVICE", "android.permission.FOREGROUND_SERVICE_LOCATION"],
      package: "com.NUSMaps",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY,
        },
      },
    },
    updates: {
      url: "https://u.expo.dev/d1edafc1-d6d0-4cb4-a316-8b79e8aa292e",
    },
    runtimeVersion: "1.0.0",
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationAlwaysPermission: "Allow $(PRODUCT_NAME) to use your location.",
          locationWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-font",
        {
          fonts: ["./assets/fonts"],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "d1edafc1-d6d0-4cb4-a316-8b79e8aa292e",
      },
      EXPO_PUBLIC_GOOGLEMAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY,
      EXPO_PUBLIC_ONEMAPAPITOKEN: process.env.EXPO_PUBLIC_ONEMAPAPITOKEN,
    },
  },
};
