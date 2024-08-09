import React from "react";
import { render, fireEvent, waitFor, cleanup } from "@testing-library/react-native";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import BusStopsScreen from "@/app/(tabs)/index";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
const mockBusStops = [
  {
    busStopId: "1",
    busStopName: "NUSSTOP_COM3",
    savedBuses: [{ busNumber: "945A", timings: ["2024-07-29T00:30:00Z", "2024-07-29T01:00:00Z"] }],
    isFavourited: false,
  },
  {
    busStopId: "2",
    busStopName: "NUSSTOP_PGPR",
    savedBuses: [
      { busNumber: "A1", timings: ["2024-07-30T08:25:00.000Z", "2024-07-30T08:35:00.000Z"] },
      { busNumber: "A2", timings: ["2024-07-30T08:20:00.000Z", "2024-07-30T08:30:00.000Z"] },
    ],
    isFavourited: false,
  },
];

let asyncStorageData = JSON.stringify(mockBusStops);
AsyncStorage.getItem = jest.fn((key) => {
  return Promise.resolve(asyncStorageData);
});
AsyncStorage.setItem = jest.fn((key, value) => {
  asyncStorageData = value;
  return Promise.resolve();
});

// Mock Vector Icons
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: "Ionicons",
    MaterialCommunityIcons: "MaterialCommunityIcons",
  };
});

// Mock expo-location
jest.mock("expo-location", () => {
  return {
    requestForegroundPermissionsAsync: jest.fn(async () => ({
      status: "granted",
    })),
    getCurrentPositionAsync: jest.fn(async () => ({
      coords: {
        latitude: 1.3521,
        longitude: 103.8198,
      },
    })),
    getLastKnownPositionAsync: jest.fn(async () => ({
      coords: {
        latitude: 1.3521,
        longitude: 103.8198,
      },
    })),
  };
});

// Mock SegmentedControl
jest.mock("@react-native-segmented-control/segmented-control", () => {
  const { View, Text } = require("react-native");
  return (props: { values: any[]; onChange: (arg0: { nativeEvent: { selectedSegmentIndex: any } }) => any }) => (
    <View>
      {props.values.map((value, index) => (
        <Text key={index} onPress={() => props.onChange({ nativeEvent: { selectedSegmentIndex: index } })} testID={`segmented-control-${value}`}>
          {value}
        </Text>
      ))}
    </View>
  );
});
// Mock react-query's useQuery
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    switch (queryKey[0]) {
      case "favouriteBusStops":
        return { data: [], isLoading: false, isError: false, error: null };
      case "busStopsByLocation":
        return { data: mockBusStops, isLoading: false, isError: false, error: null };
      case "nusBusStops":
        return { data: mockBusStops, isLoading: false, isError: false, error: null };
    }
  }),
}));

// Create a new query client for each test
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries to make tests fail fast
      },
    },
    queryCache: new QueryCache({
      onError: jest.fn(),
    }),
  });

describe("BusStopsScreen", () => {
  let queryClient: QueryClient;
  queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { gcTime: 0 } });

  afterEach(() => {
    queryClient.clear(); // Clear the query client
    cleanup(); // Ensure cleanup after each test
    // jest.clearAllMocks(); // Clear all mocks
  });

  it("should render FavouriteBusStops, NearbyBusStops, and NUSBusStops when the corresponding tab is selected", async () => {
    const { getByText, queryByText, getByTestId } = render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <BusStopsScreen />
        </QueryClientProvider>
      </NavigationContainer>
    );

    // Initial state - Favourites tab
    await waitFor(() => {
      expect(getByText("No bus stops have been favourited yet!")).toBeTruthy();
    });

    // Navigate to Nearby tab
    fireEvent.press(getByTestId("segmented-control-Nearby"));
    await waitFor(() => {
      expect(queryByText("No bus stops have been favourited yet!")).toBeNull();
      expect(queryByText("COM 3")).toBeTruthy();
      expect(queryByText("Prince George's Park Foyer")).toBeTruthy();
    });

    // Navigate to NUS tab
    fireEvent.press(getByTestId("segmented-control-NUS"));
    await waitFor(() => {
      expect(queryByText("No bus stops have been favourited yet!")).toBeNull();
      expect(queryByText("COM 3")).toBeTruthy();
      expect(queryByText("Prince George's Park Foyer")).toBeTruthy();
    });

    // Navigate back to favourites tab
    fireEvent.press(getByTestId("segmented-control-Favourites"));
    await waitFor(() => {
      expect(getByText("No bus stops have been favourited yet!")).toBeTruthy();
    });
  });
});
