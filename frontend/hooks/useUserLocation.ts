import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import Toast from "react-native-toast-message";

const useUserLocation = (refreshLocation: number) => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [locationReady, setLocationReady] = useState(false); // this is to only allow querying is getting user's current location is completed.

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPermissionErrorMsg("Permission to access location was denied.");
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
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
    if (permissionErrorMsg) {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please enable location permissions for NUSMaps.",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

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