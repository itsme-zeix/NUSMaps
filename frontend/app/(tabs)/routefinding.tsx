import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import RouteSearchBar from "@/components/RouteSearchBar";
import Toast from "react-native-toast-message";
import ResultScreen from "@/components/ResultsScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";

type destinationLocation = {
  address: string;
  placeId: string;
};
export default function App() {
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObjectCoords>({
      latitude: 1.3521,
      longitude: 103.8198,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  const [region, setRegion] = useState<Region>({
    latitude: 1.3521, // Default to Singapore's latitude
    longitude: 103.8198, // Default to Singapore's longitude
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [isResultAttained, setisResultAttained] = useState(false);
  const [destination, setDestination] = useState<destinationLocation>({
    address: "DEFAULT",
    placeId: "DEFAULT",
  });
  // const searchBarRef = useRef<GooglePlacesAutocompleteRef>(null); // used to manage the ref so that it can be passed to the results modal
  const getDestinationResult = (data) => {
    setDestination({ address: data.description, placeId: data.place_id });
  };
  //to change when the destination changes
  useEffect(() => {
    if (destination.address !== "DEFAULT") {
      setisResultAttained(true);
    }
  }, [destination]);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setPermissionErrorMsg("Permission to access location was denied.");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        console.log(location);
        setCurrentLocation(location.coords);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        setLocationErrorMsg(`Failed to obtain location, ${error}`);
        console.error("Failed to obtain location.", error);
      }
    };
    getLocation();
  }, []);

  // Toast to display error from denial of gps permission
  useEffect(() => {
    if (permissionErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

  //Toast to display error from inability to fetch location even with gps permission
  useEffect(() => {
    if (locationErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: locationErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [locationErrorMsg]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region}>
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
        <View style={styles.overlay}>
          <RouteSearchBar
            location={currentLocation}
            getDestinationResult={getDestinationResult}
          />
          <ResultScreen
            origin={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            departureTiming="1:05am"
            arrivalTiming="6:02am"
            travelTime="4 hr 57 min"
            types={["walk", "bus", "walk", "train", "walk"]}
            isVisible={isResultAttained}
            setIsVisible={setisResultAttained}
            destination={destination}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 50,
    alignContent: "center",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0)",
  },
});
