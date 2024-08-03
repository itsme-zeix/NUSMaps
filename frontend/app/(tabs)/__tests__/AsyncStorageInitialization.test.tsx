import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import RootLayout from "@/app/_layout";

jest.mock("expo-router", () => ({
  Stack: ({ children }: { children: string }) => "children",
  Screen: ({ children }: { children: string }) => "children",
  useRouter: jest.fn(),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: "true",
  },
}));

const mockBusStops = [
  { id: 1, name: "Stop 1" },
  { id: 2, name: "Stop 2" },
];

axios.get.mockResolvedValue({ status: 200, data: mockBusStops });

describe("RootLayout", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    axios.get.mockClear();
  });

  test("initializes AsyncStorage on first launch", async () => {
    const { getByText } = render(<RootLayout />);

    await waitFor(async () => {
      const isInitialized = await AsyncStorage.getItem("isInitialized");
      expect(isInitialized).toBe("true");
      const storedBusStops = await AsyncStorage.getItem("busStops");
      expect(storedBusStops).not.toBeNull();
      const busStops = JSON.parse(storedBusStops);
      expect(busStops.length).toBe(mockBusStops.length);
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("does not reinitialize AsyncStorage after first launch", async () => {
    await AsyncStorage.setItem("isInitialized", "true");
    const { getByText } = render(<RootLayout />);

    await waitFor(async () => {
      const isInitialized = await AsyncStorage.getItem("isInitialized");
      expect(isInitialized).toBe("true");
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
