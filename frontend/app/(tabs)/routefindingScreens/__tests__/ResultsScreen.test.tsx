// RefactoredResultsScreen.test.js
import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react-native";
import RefactoredResultsScreen, { ResultCard } from "../ResultsScreen";

// Ensure the mock is correctly set up at the top of your file
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  isReady: true,
};

const JOURNEYTIMINGTEST = "15 mins";
const WHOLEJOURNEYTIMINGTEST = "12:00 PM - 12:15 PM";
const mockOrigin = JSON.stringify({ latitude: 1.3521, longitude: 103.8198 });
const mockDestination = JSON.stringify({ latitude: 1.3975288346798842, longitude: 103.7470784569654 });
const mockBaseResultsData = JSON.stringify([
  {
    types: ["SUBWAY", "TRAM", "WALK"],
    journeyLegs: [
      { serviceType: "DT", type: "SUBWAY" },
      { serviceType: "BP", type: "TRAM" },
      { serviceType: "NONE", type: "WALK" },
    ],
    journeyTiming: JOURNEYTIMINGTEST,
    wholeJourneyTiming: WHOLEJOURNEYTIMINGTEST,
  },
]); // Adjust this to your actual mock data
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useLocalSearchParams: () => {
    // Define mock values directly within the function
    //test case doesnt use bus, as that lead to very funky mocking required, which is not the point of this test
    return {
      origin: mockOrigin,
      destination: mockDestination,
      baseResultsData: mockBaseResultsData,
    };
  },
  useRouter: () => mockRouter,
}));

jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: "Ionicons",
    MaterialCommunityIcons: "MaterialCommunityIcons",
    MaterialIcons: "MaterialIcons",
  };
});

jest.mock("react-native-vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ name, ...props }: { name: string }) => <Text {...props}>{name}</Text>;
});

interface ResultsCardInterface {
  nextScreenFunc: () => void;
}

describe("RefactoredResultsScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders the ResultCard subcomponent", async () => {
    const { getByTestId } = render(<RefactoredResultsScreen />);
    await waitFor(() => {
      expect(getByTestId("result-card-0")).toBeTruthy();
    });
  });
  test("the journeyTiming and whole journey timing of a result card is rendered", async () => {
    const { getByTestId } = render(<RefactoredResultsScreen />);
    const journeyTimingText = screen.getByText(JOURNEYTIMINGTEST);
    const wholeJourneyTimingText = screen.getByText(WHOLEJOURNEYTIMINGTEST);
    expect(journeyTimingText).toBeTruthy();
    expect(wholeJourneyTimingText).toBeTruthy();
  });
  test("Retrieves the correct type of transport depending on transport type + checks for rendering of chevron after every leg", async () => {
    const { getByTestId } = render(<RefactoredResultsScreen />);
    expect(getByTestId("result-card-0-SubwayTypeCard-0")).toBeTruthy();
    expect(getByTestId("result-card-0-WalkOrChevronCard-1")).toBeTruthy();
    expect(getByTestId("result-card-0-TramTypeCard-2")).toBeTruthy();
    expect(getByTestId("result-card-0-WalkOrChevronCard-3")).toBeTruthy();
    expect(getByTestId("result-card-0-WalkOrChevronCard-4")).toBeTruthy();
  });
  test("Checks whether (1) pressable is rendered in results card is rendered, (2) whether it is pressable, (3) Whether it redirects to the DetailedRouteScreen", async () => {
    const ref = React.createRef<ResultsCardInterface>();
    const parsedElement = JSON.parse(mockBaseResultsData)[0];
    const { getByTestId } = render(<ResultCard ref={ref} origin={JSON.parse(mockOrigin)} destination={JSON.parse(mockDestination)} resultData={parsedElement} testID={"result-card-0"} />);
    expect(ref.current).toBeDefined();
    const routerPushSpy = jest.spyOn(mockRouter, "push");
    const pressableComponent = getByTestId("result-card-0");
    fireEvent.press(pressableComponent);
    expect(routerPushSpy).toHaveBeenCalledWith({
      pathname: "../routefindingScreens/DetailedRouteScreen",
      params: {
        origin: mockOrigin,
        destination: mockDestination,
        baseResultsCardData: JSON.stringify(parsedElement),
      },
    });
  });
});
