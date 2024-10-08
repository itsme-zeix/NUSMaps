import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";

const useUserLocation = (refreshLocation: number) => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [locationReady, setLocationReady] = useState(false); // this is to only allow querying is getting user's current location is completed.

  const getLocation = async () => {
    try {
      let location;
      // Because getCurrentPositionAsync() is awfully slow in IOS,
      // expo-location documentation recommends using getLastKnownPositionAsync() instead. 
      if (Platform.OS === "ios") {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          location = last;
        } else {
          const current = await Location.getCurrentPositionAsync();
          location = current;
        }
      } else {
        location = await Location.getCurrentPositionAsync();
      }
      setLocation(location);
      setLocationReady(true);
    } catch (error) {
      setLocationErrorMsg(`Failed to obtain location, ${error}`);
    }
  };

  useEffect(() => {
    getLocation();
  }, [refreshLocation]);

  useEffect(() => {
    if (locationErrorMsg) {
      Toast.show({
        type: "error",
        text1: locationErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [locationErrorMsg]);

  return locationReady ? location : null;
};

export default useUserLocation;
