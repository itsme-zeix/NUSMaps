import React, { createRef } from "react";
import {
  render,
  act,
} from "@testing-library/react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import App from "../Main";
//NOTE THIS TEST FILE WAS SEPARATED FROM main.test.tsx because of 
//(1) Issues with reconfiguring expo-constants, after 7 hours of ordeal, 
//one cannot use .doMock or even just adjust the Constants.expoConfig prop, 
//as react native components cannot be reimported like es6 modules
//(2) It was easier to specify another mock value for Constants.expoconfig
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));
jest.mock('react-native-maps', () => {
    const React = require('react');
    const MockMapView = (props) => <div {...props} />;
    const MockMarker = (props) => <div {...props} />;
    return {
      __esModule: true,
      default: MockMapView,
      Marker: MockMarker,
    };
  });
jest.mock('axios'); //used to simulate api call fails
  
jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_GOOGLEMAPS_API_KEY: "globalMockedValidKey",
      EXPO_PUBLIC_ONEMAPAPITOKEN: undefined,
    },
  },
}));

const TESTLOCATION = {
  latitude: 1.3489977386432621,
  longitude: 103.7492952313956,
};

describe("error handling for valid onemap token but invalid server response", () => {
  afterEach(() => {
    jest.resetModules();
  });
  test("shows a toast message when the server request fails because of a missing onemaps api token", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
        { status: "granted" }
      );
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: TESTLOCATION,
    });
    const { getByText } = render(
      <App
        ref={(ref) => {
          if (ref) {
            fetchRoutesFromServer = ref.fetchRoutesFromServer;
          }
        }}
      />
    );

    // Arrange: mock axios to reject with an error
    
    const origin = { latitude: 1.3521, longitude: 103.8198 };
    const destination = { latitude: 1.3521, longitude: 103.8198 };
    
    let fetchRoutesFromServer;

    await act(async () => {
        await expect(fetchRoutesFromServer(origin, destination)).rejects.toThrow(
            "API token could not be found. Please try again"
        );
    });


    // Assert: Check if the Toast was shown with the correct message
    expect(Toast.show).toHaveBeenCalledWith({
      type: "error",
      text1: "Server issues, please try again later. API TOKEN ERROR",
      text2: "Please try again later",
      position: "top",
      autoHide: true,
    });
  });
});
