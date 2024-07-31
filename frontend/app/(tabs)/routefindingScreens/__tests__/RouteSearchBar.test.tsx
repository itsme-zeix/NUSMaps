import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { RouteSearchBar } from "../../../../components/RouteSearchBar";

jest.useFakeTimers();

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_GOOGLEMAPS_API_KEY: "globalMockedValidKey",
      EXPO_PUBLIC_ONEMAPAPITOKEN: "globalMockedValidToken",
    },
  },
}));

describe("Tests on the search bar", () => {
  afterEach(() => {
    jest.resetModules();
  });
  const MOCKEDLOCATION = { latitude: 1.3521, longitude: 103.8198, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null };
  const getDestinationResult = jest.fn(); //we mock this so we can test whether this is pressed
  const testId = "searchBar";
  test("is the search bar rendered", () => {
    const { getByPlaceholderText } = render(<RouteSearchBar location={MOCKEDLOCATION} getDestinationResult={getDestinationResult} testID={testId} />);
    const GooglePlacesAutoCompleteComponent = getByPlaceholderText("Where to?");
    expect(GooglePlacesAutoCompleteComponent).toBeTruthy();
  });
  test("is search bar tappable?", () => {
    const { getByPlaceholderText } = render(<RouteSearchBar location={MOCKEDLOCATION} getDestinationResult={getDestinationResult} testID={testId} />);
    const GooglePlacesAutoCompleteComponent = getByPlaceholderText("Where to?");
    fireEvent.press(GooglePlacesAutoCompleteComponent);
    expect(getDestinationResult).toHaveBeenCalled();
  });
});
