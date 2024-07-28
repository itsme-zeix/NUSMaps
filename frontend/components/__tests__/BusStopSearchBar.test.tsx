import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BusStopSearchBar from "@/components/busStopsTab/BusStopSearchBar"; // Adjust the path as necessary
import { NavigationContainer } from "@react-navigation/native";

// Mock the useNavigation hook
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});
jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name, ...props }) => {
    return <Text {...props}>{name}</Text>;
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name, ...props }) => {
    return <Text {...props}>{name}</Text>;
  };
});
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ name, ...props }) => <Text {...props}>{name}</Text>;
});


describe("BusStopSearchBar", () => {
  it("renders correctly", () => {
    const { getByText } = render(
      <NavigationContainer>
        <BusStopSearchBar />
      </NavigationContainer>
    );

    expect(getByText("Search")).toBeTruthy();
  });

  it("navigates to BusStopSearchScreen on press", () => {
    const { getByText } = render(
      <NavigationContainer>
        <BusStopSearchBar />
      </NavigationContainer>
    );

    const searchButton = getByText("Search");
    fireEvent.press(searchButton);

    expect(mockNavigate).toHaveBeenCalledWith("BusStopSearchScreen", { initialQuery: "" });
  });
});
