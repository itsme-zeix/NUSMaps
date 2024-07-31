import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFavouritedBusStops } from "@/utils/storage";

const mockBusStops = [
  {
    busStopName: "Stop 1",
    busStopId: "1",
    distanceAway: "500m",
    savedBuses: [],
    latitude: 1.3521,
    longitude: 103.8198,
    isFavourited: true,
  },
  {
    busStopName: "Stop 2",
    busStopId: "2",
    distanceAway: "600m",
    savedBuses: [],
    latitude: 1.3522,
    longitude: 103.8199,
    isFavourited: false,
  },
  {
    busStopName: "Stop 3",
    busStopId: "3",
    distanceAway: "700m",
    savedBuses: [],
    latitude: 1.3523,
    longitude: 103.82,
    isFavourited: true,
  },
];

describe("getFavouritedBusStops", () => {
  beforeEach(() => {
    AsyncStorage.clear(); // Clear AsyncStorage before each test
  });

  test("retrieves only favourite bus stops", async () => {
    await AsyncStorage.setItem("busStops", JSON.stringify(mockBusStops));

    const favouriteBusStops = await getFavouritedBusStops();

    expect(favouriteBusStops.length).toBe(2);
    expect(favouriteBusStops).toEqual([
      {
        busStopName: "Stop 1",
        busStopId: "1",
        distanceAway: "500m",
        savedBuses: [],
        latitude: 1.3521,
        longitude: 103.8198,
        isFavourited: true,
      },
      {
        busStopName: "Stop 3",
        busStopId: "3",
        distanceAway: "700m",
        savedBuses: [],
        latitude: 1.3523,
        longitude: 103.82,
        isFavourited: true,
      },
    ]);
  });

  test("returns an empty array if no bus stops are favourited", async () => {
    const nonFavouritedBusStops = mockBusStops.map((busStop) => ({
      ...busStop,
      isFavourited: false,
    }));
    await AsyncStorage.setItem("busStops", JSON.stringify(nonFavouritedBusStops));

    const favouriteBusStops = await getFavouritedBusStops();

    expect(favouriteBusStops.length).toBe(0);
    expect(favouriteBusStops).toEqual([]);
  });

  test("returns an empty array if no bus stops are stored", async () => {
    const favouriteBusStops = await getFavouritedBusStops();

    expect(favouriteBusStops.length).toBe(0);
    expect(favouriteBusStops).toEqual([]);
  });
});
