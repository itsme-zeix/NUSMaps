// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getFavouritedBusStops = async () => {
  try {
    const busStops = await AsyncStorage.getItem("busStops");
    let busStopsArray = [];
    if (busStops !== null) {
      busStopsArray = JSON.parse(busStops);

      return busStopsArray.filter((busStop) => busStop.isFavourited);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch favourited bus stops from storage", error);
    return [];
  }
};
