import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

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

export const resetFavourites = async () => {
  try {
    const busStops = await AsyncStorage.getItem("busStops");
    if (busStops !== null) {
      let busStopsArray = JSON.parse(busStops);

      // Reset the isFavourited property for all bus stops
      busStopsArray = busStopsArray.map((busStop: BusStop) => ({
        ...busStop,
        isFavourited: false,
      }));

      // Save the updated bus stops array back to AsyncStorage
      await AsyncStorage.setItem("busStops", JSON.stringify(busStopsArray));
      console.log("Successfully reset favourites");
    }
  } catch (error) {
    console.error("Failed to reset favourites", error);
  }
};
