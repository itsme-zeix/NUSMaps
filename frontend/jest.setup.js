// jest.setup.js

//GLOBAL JEST settings
jest.mock('expo-constants', () => ({
  expoConfig: {
      extra: {
        EXPO_PUBLIC_GOOGLEMAPS_API_KEY: 'globalMockedValidKey',
        EXPO_PUBLIC_ONEMAPAPITOKEN: 'globalMockedValidToken',
      },
    }
  })
);
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => (['']),
}));
jest.mock('react-native-gesture-handler', () => {
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