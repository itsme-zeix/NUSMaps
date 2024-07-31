import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BusStopsScreen } from "@/app/(tabs)/index";

// Mock axios
jest.mock("axios");

// Mock expo-location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: "granted",
  })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 1.3521,
      longitude: 103.8198,
    },
  })),
}));

// Mock Vector Icons
jest.mock("react-native-vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: "Ionicons",
    MaterialCommunityIcons: "MaterialCommunityIcons",
  };
});

const mockBusStops = [
  {
    busStopId: "1",
    busStopName: "NUSSTOP_COM3",
    isFavourited: false,
  },
  {
    busStopId: "2",
    busStopName: "NUSSTOP_PGPR",
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

(axios.get as jest.Mock).mockResolvedValue({
  data: [
    {
      busStopName: "NUSSTOP_COM3",
      busStopId: "1",
      distanceAway: "0.2",
      savedBuses: [
        { busNumber: "A1", timings: ["2024-07-30T08:25:00.000Z", "2024-07-30T08:35:00.000Z"] },
        { busNumber: "A2", timings: ["2024-07-30T08:20:00.000Z", "2024-07-30T08:30:00.000Z"] },
      ],
      latitude: 1.3521,
      longitude: 103.8198,
      isFavourited: true,
    },
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      retry: false,
    },
    mutations: {
      gcTime: 0,
      retry: false,
    },
  },
});

describe("BusStopsScreen", () => {
  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it("displays 'no bus stops have been favourited yet!' if there are no favourited bus stops", async () => {
    const { getByText, queryByText, getByTestId, debug } = render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <BusStopsScreen />
        </QueryClientProvider>
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText("No bus stops have been favourited yet!")).toBeTruthy();
    });
  });
});
