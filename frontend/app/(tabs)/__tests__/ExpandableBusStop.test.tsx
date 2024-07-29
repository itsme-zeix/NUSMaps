import React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react-native";
import { ExpandableBusStop } from "@/app/(tabs)/index";

interface BusService {
  busNumber: string;
  timings: string[]; // ISO format
}
interface BusStop {
  busStopName: string;
  busStopId: string;
  distanceAway: string;
  savedBuses: BusService[];
  latitude: number;
  longitude: number;
  isFavourited: boolean;
}

jest.mock("@expo/vector-icons/Ionicons", () => "Icon");

const NUSBusStop: BusStop = {
  busStopName: "NUSSTOP_KRMRT",
  busStopId: "10",
  distanceAway: "0.05",
  savedBuses: [
    {
      busNumber: "D1",
      timings: ["2024-07-29T00:30:00Z", "2024-07-29T01:00:00Z"],
    },
  ],
  latitude: 1.294923,
  longitude: 103.784603,
  isFavourited: true,
};

const PublicBusStop: BusStop = {
  busStopName: "Bt Batok Interchange",
  busStopId: "10",
  distanceAway: "0.05",
  savedBuses: [
    {
      busNumber: "D1",
      timings: ["2024-07-29T00:30:00Z", "2024-07-29T01:00:00Z"],
    },
  ],
  latitude: 1.294923,
  longitude: 103.784603,
  isFavourited: true,
};

describe("ExpandableBusStop tests", () => {
  test("renders ExpandableBusStopComponent with bus service name and distance", async () => {
    const { getByText } = render(<ExpandableBusStop item={PublicBusStop} />);
    expect(getByText("Bt Batok Interchange")).toBeTruthy();
    expect(getByText("~50m away")).toBeTruthy();
  });

  test("Categorizes bus stop type correctly (slices 'NUSSTOP_' from NUS Bus Stops)", () => {
    const { getByText } = render(<ExpandableBusStop item={NUSBusStop} />);
    expect(getByText("KRMRT")).toBeTruthy();
  });

  test("Renders NUSTag on detecting NUSStop", () => {
    const { getByText } = render(<ExpandableBusStop item={NUSBusStop} />);
    expect(getByText("NUS")).toBeTruthy();
  });

  test("Does not render NUSTag for non-NUS stops", () => {
    const { queryByText } = render(<ExpandableBusStop item={PublicBusStop} />);
    expect(queryByText("NUS")).toBeNull();
  });
});
