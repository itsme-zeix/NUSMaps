import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const getFavouritedBusStops = async () => {
  try {
    const busStops = await AsyncStorage.getItem("busStops");
    let busStopsArray = [];
    if (busStops !== null) {
      busStopsArray = JSON.parse(busStops);

      return busStopsArray.filter((busStop: BusStop) => busStop.isFavourited);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch favourited bus stops from storage", error);
    return [];
  }
};
