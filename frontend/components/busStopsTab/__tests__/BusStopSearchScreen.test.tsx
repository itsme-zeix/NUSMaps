import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BusStopSearchScreen from "../BusStopSearchScreen"; // Adjust the import path

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
    MaterialIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
    FontAwesome: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

// Mock react-native-elements
jest.mock("@rneui/base", () => {
  const { Text, TextInput } = require("react-native");
  return {
    SearchBar: ({ value, onChangeText, ...props }: {value: string, onChangeText: string}) => <TextInput value={value} onChangeText={onChangeText} {...props} />,
    Icon: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const Stack = createStackNavigator();

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

describe("BusStopSearchScreen", () => {
  test("toggles favourite status of a bus stop", async () => {
    const component = (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="BusStopSearch" component={BusStopSearchScreen} initialParams={{ initialQuery: "" }} />
        </Stack.Navigator>
      </NavigationContainer>
    );

    const { getByText, getByLabelText, queryByText } = render(component);

    // Wait for loading to complete
    await waitFor(() => expect(getByText("COM 3")).toBeTruthy());

    expect(queryByText("star")).toBeFalsy();
    expect(getByLabelText("toggle-favourite-1")).toBeTruthy();
    expect(getByLabelText("toggle-favourite-2")).toBeTruthy();

    // Toggle favourite status of the first bus stop
    fireEvent.press(getByLabelText("toggle-favourite-1"));

    // Wait for the state to update and check the text inside the icon
    await waitFor(() => expect(queryByText("star")).toBeTruthy());

    // Verify the data is updated in AsyncStorage
    const storedData = await AsyncStorage.getItem("busStops");
    const updatedBusStops = JSON.parse(storedData!);
    console.log(updatedBusStops[0].isFavourited, updatedBusStops[1].isFavourited);
    expect(updatedBusStops[0].isFavourited).toBe(true);
    expect(updatedBusStops[1].isFavourited).toBe(false);
  });
});
