// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getFavoritedBusStops = async () => {
  try {
    const busStops = await AsyncStorage.getItem("busStops");
    if (busStops !== null) {
      const busStopsArray = JSON.parse(busStops);
      return busStopsArray.filter((busStop) => busStop.isFavorited);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch favorited bus stops from storage", error);
    return [];
  }
};
