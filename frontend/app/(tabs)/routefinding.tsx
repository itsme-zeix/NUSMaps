import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import BusStopSearchBar from '@/components/BusStopSearchBar';
import Toast from "react-native-toast-message";

export default function App() {

  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 1.3521,  // Default to Singapore's latitude
    longitude: 103.8198,  // Default to Singapore's longitude
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setErrorMsg("Permission to access location was denied. Please enable location permissions for the routing feature.")
        return;
      }
      
      try {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.error("Failed to obtain location.", error);
      }
    };
    getLocation();
  }, []);

  // Toast to display error
  useEffect(() => {
    let text;
    if (errorMsg != "") {
      text = errorMsg;
      Toast.show({
        type : "error",
        text1: text,
        text2: "Please try again later",
        position : "top",
        autoHide: true,
      });
    }
  }, [errorMsg]);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE}region={region}>
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
          />
        )}
      </MapView>
      <View style={styles.overlay} >
        <BusStopSearchBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    alignContent: 'center',
    width: "100%",
    backgroundColor: 'rgba(255, 255, 255, 0)',
  }
});
