import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import App from "../Main"; // Ensure this is the correct path to your component
import axios from "axios";
import { BackHandler } from "react-native";
import { LatLng } from "react-native-maps"
import { GooglePlaceData } from "react-native-google-places-autocomplete";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 'true'
  }
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const MockMapView = (props) => <div {...props} />;
  const MockMarker = (props) => <div {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

jest.mock("axios"); // Mock axios to simulate API calls

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn()
};
const mockSegments = ["home", "details"];
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return {
    ...actual,
    useRouter: () => mockRouter,
    useSegments: () => mockSegments
  };
});

jest.mock('react-native/Libraries/Utilities/BackHandler', () => {
  return jest.requireActual(
    'react-native/Libraries/Utilities/__mocks__/BackHandler.js',
  );
});

const DEFAULTLOCATION = {
  latitude: 1.3521,
  longitude: 103.8198,
};

const TESTLOCATION = {
  latitude: 1.3489977386432621,
  longitude: 103.7492952313956,
};

interface AppInstance {
  fetchBestRoute: (origin: LatLng, destination: LatLng) => Promise<void>;
  getLatLngFromId: (placeId:string) => Promise<LatLng>;
  getDestinationResult: (data:GooglePlaceData) => Promise<void>;
  setDestination:(destination: {address:string, placeId:string} & LatLng) => void
};

describe("Straight forward toasts/error handling", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    mockRouter.replace.mockReset();
  });

  it("requests location permission and checks if the screen is rendered correctly + whether the mapview renders correctly", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "granted" }
    );
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: TESTLOCATION,
    });
    const { getByTestId } = render(<App />);
    const marker = await waitFor(() => getByTestId("current-location-marker"));
    const map = await waitFor(() => getByTestId("current-location-map"));

    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();

    expect(marker.props.coordinate).toEqual({
      latitude: TESTLOCATION.latitude,
      longitude: TESTLOCATION.longitude,
    });
    expect(map.props.region).toEqual({
      latitude: TESTLOCATION.latitude,
      longitude: TESTLOCATION.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }, 10000);

  it("handles permission denied", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "denied" }
    );

    const { getByTestId } = render(<App />);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Permission to access location was denied.",
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    });

    const marker = await waitFor(() => getByTestId("current-location-marker"));
    const map = await waitFor(() => getByTestId("current-location-map"));
    expect(marker.props.coordinate).toEqual({
      latitude: DEFAULTLOCATION.latitude,
      longitude: DEFAULTLOCATION.longitude,
    });
    expect(map.props.region).toEqual({
      latitude: DEFAULTLOCATION.latitude,
      longitude: DEFAULTLOCATION.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  });

  it("handles permission granted but location cannot be attained", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "granted" }
    );
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      "GPS failed"
    );
    render(<App />);
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Failed to obtain location, GPS failed",
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    });
  });
});

describe("Tests that involve user navigation", () => {
  
  const setup = async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: TESTLOCATION });

    const origin = { latitude: 1.3521, longitude: 103.8198 };
    const mockDestination = { latitude: 1.3489977386432621, longitude: 103.7492952313956 };
    const mockBaseResultsCard = [{
      types: ['BUS'],
      journeyTiming: '2 min',
      wholeJourneyTiming: '3:00pm- 4:00pm',
      journeyLegs: [],
      polylineArray: [],
      stopsCoordsArray: []
    }];
    const DEFAULTDESTINATIONLatLng = {
      latitude: NaN,
      longitude: NaN,
      address: "DEFAULT",
      placeId: "DEFAULT",
    };
    (axios.post as jest.Mock).mockResolvedValue({ data: mockBaseResultsCard });

    const ref = React.createRef<AppInstance>();
    render(<App ref={ref} />);

    // Make sure the component is mounted and ref is assigned
    expect(ref.current).toBeDefined();

    const fetchBestRouteSpy = jest.spyOn(ref.current!, 'fetchBestRoute');
    const routerReplaceSpy = jest.spyOn(mockRouter, 'replace');
    const routerPushSpy = jest.spyOn(mockRouter, 'push');

    return { ref, fetchBestRouteSpy, routerReplaceSpy, routerPushSpy, origin, mockDestination, mockBaseResultsCard, DEFAULTDESTINATIONLatLng };
  };
  it("checks if the router.push and router.replace function is called when a successful result is attained from backend.", async () => {
    const { ref, fetchBestRouteSpy, routerReplaceSpy, routerPushSpy, origin, mockDestination, mockBaseResultsCard, DEFAULTDESTINATIONLatLng } = await setup();
    await act(async () => {
      console.log("Setting destination state...");
      ref.current!.setDestination({
        latitude: mockDestination.latitude,
        longitude: mockDestination.longitude,
        address: "DEFAULT",
        placeId: "DEFAULT"
      });
    });
    await waitFor(() => {
      //this replacement is the sign that the function has been called, despite bugs with the func itself being called
      expect(routerPushSpy).toHaveBeenCalledWith({
        pathname: "../routefindingScreens/loadingScreen"
      });
      expect(routerReplaceSpy).toHaveBeenCalledWith({
        pathname: "../routefindingScreens/ResultsScreen", // COULD BREAK WITH REFACTORING
        params: {
          origin: JSON.stringify(origin),
          destination: JSON.stringify({latitude:mockDestination.latitude, longitude:mockDestination.longitude, address:DEFAULTDESTINATIONLatLng.address, placeId: DEFAULTDESTINATIONLatLng.placeId}),
          baseResultsData: JSON.stringify(mockBaseResultsCard)
        }
      });
    });
    fetchBestRouteSpy.mockRestore();
    routerReplaceSpy.mockRestore();
  });
  // it("check if the back button on the result screen results in navigation back to the base search screen", async () => {
  //   const { ref, fetchBestRouteSpy, routerReplaceSpy, routerPushSpy, origin, mockDestination, mockBaseResultsCard, DEFAULTDESTINATIONLatLng } = await setup();
  //   await act(async ()=> {
  //     ref.current!.setDestination({
  //       latitude: mockDestination.latitude,
  //       longitude: mockDestination.longitude,
  //       address: "DEFAULT",
  //       placeId: "DEFAULT"
  //     });
  //   });
  //   await waitFor(() => {
  //     //this replacement is the sign that the function has been called, despite bugs with the func itself being called
  //     expect(routerPushSpy).toHaveBeenCalledWith({
  //       pathname: "../routefindingScreens/loadingScreen"
  //     });
  //     expect(routerReplaceSpy).toHaveBeenCalledWith({
  //       pathname: "../routefindingScreens/ResultsScreen", // COULD BREAK WITH REFACTORING
  //       params: {
  //         origin: JSON.stringify(origin),
  //         destination: JSON.stringify({latitude:mockDestination.latitude, longitude:mockDestination.longitude, address:DEFAULTDESTINATIONLatLng.address, placeId: DEFAULTDESTINATIONLatLng.placeId}),
  //         baseResultsData: JSON.stringify(mockBaseResultsCard)
  //       }
  //     });
  //   });

  // })
});