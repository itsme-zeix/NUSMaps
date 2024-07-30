// jest.setup.js
export * from '@react-native-async-storage/async-storage/jest/async-storage-mock';

//GLOBAL JEST settings
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_GOOGLEMAPS_API_KEY: "globalMockedValidKey",
      EXPO_PUBLIC_ONEMAPAPITOKEN: "globalMockedValidToken",
    },
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [""],
  Tabs: ({ children }) => <>{children}</>,
  TabsScreen: ({ children, options }) => <>{children}</>,
}));

jest.mock("react-native-gesture-handler", () => {
  return {
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: jest.fn().mockImplementation(({ children }) => children),
    DrawerLayout: jest.fn().mockImplementation(({ children }) => children),
    State: {},
    PanGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    TapGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    FlingGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    ForceTouchGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    LongPressGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    PinchGestureHandler: jest.fn().mockImplementation(({ children }) => children),
    RotationGestureHandler: jest.fn().mockImplementation(({ children }) => children),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    MaterialIcons: View,
    Ionicons: View,
  };
});

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [false, null]), // Default mock return value
}));


jest.mock("expo-asset");
jest.mock("expo", () => ({
  Linking: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    openURL: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn(),
  },
}));

jest.mock("expo-dev-client", () => ({
}));

jest.mock("expo-linking", () => ({
  openURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock("expo-location", () => ({
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-sqlite", () => ({
  openDatabase: jest.fn().mockReturnValue({
    transaction: jest.fn(),
  }),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: {
    setStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    setHidden: jest.fn(),
  },
}));

jest.mock("expo-system-ui", () => ({
  useSystemUIController: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('axios');
