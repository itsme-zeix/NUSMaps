import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { StyleSheet, View, Platform, Pressable, Animated } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { RouteSearchBar } from "@/components/RouteSearchBar";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlaceData } from "react-native-google-places-autocomplete";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";
import { baseResultsCardType, destinationType } from "@/types";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import CurrentLocationIcon from "@/components/CurrentLocationIcon";

//constants and variables
const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY == undefined ? Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLEMAPS_API_KEY : process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY;
const oneMapsAPIToken = process.env.EXPO_PUBLIC_ONEMAPAPITOKEN == undefined ? Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN : process.env.EXPO_PUBLIC_ONEMAPAPITOKEN;
const INTERVALFORLOCATIONREFRESH = 3 * 1000; //in ms
const App = forwardRef((props, ref) => {
  //hooks
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords>({
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
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false); //state used to maintain whether to show the user the loading screen
  const [routeErrorMsg, setRouteErrorMsg] = useState("");
  const DEFAULTDESTINATIONLatLng = {
    latitude: NaN,
    longitude: NaN,
    address: "DEFAULT",
    placeId: "DEFAULT",
  };
  const [destination, setDestination] = useState<destinationType>(DEFAULTDESTINATIONLatLng);
  const isNotInitialExec = useRef(false);

  //effects arranged in execution order
  //flow goes as follows: (1) Location Permissions + Denial error mesages
  //(2)Location error messages even when current permission is enabled
  //(3)Route error messages when unable to query backend
  //(4) State changes when user inputs a new destination, leading to a new visible modal
  //(5)

  const showLoadingScreen = () => {
    router.push({
      pathname: "../routefindingScreens/loadingScreen",
    });
  };
  // const showResultsScreenAfterLoading = (originCoords, destCoords, ) => {

  // }
  useEffect(() => {
    // if (!isNotInitialExec.current) {
    //not the initial load
    if (isLoading) {
      showLoadingScreen();
    } // nothing is done if set to false, as the other use effect will handle the replacement of the screen with the results screen
    // }
  }, [isLoading]);

  const getLocation = async () => {
    try {
      let location;
      // Because getCurrentPositionAsync() is awfully slow in IOS (~9seconds), expo-location documentation
      // recommends using getLastKnownPositionAsync() instead. 
      if (Platform.OS === "ios") {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          location = last;
        } else {
          const current = await Location.getCurrentPositionAsync();
          location = current;
        }
      } else {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: INTERVALFORLOCATIONREFRESH,
        });
      }
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      speed: 25,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    getLocation();
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 25,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    getLocation(); //initial call

    const intervalId = setInterval(() => {
      getLocation();
    }, INTERVALFORLOCATIONREFRESH);

    return () => clearInterval(intervalId);
  }, [INTERVALFORLOCATIONREFRESH]);

  useEffect(() => {
    //Toast to display error from inability to fetch location even with gps permission
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

  useEffect(() => {
    //Toast to display error from inability to fetch route from backend
    if (routeErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: routeErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [routeErrorMsg]);

  useEffect(() => {
    //function that is executed when destination is changed (a new search result is attained)
    if (isNotInitialExec.current && destination !== DEFAULTDESTINATIONLatLng) {
      console.log("new destination: ", destination);
      fetchBestRoute(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
        }
      ); //this will return back the gps coordinates which are then sent to the api
      return;
    } else {
      isNotInitialExec.current = true;
    }
  }, [destination]);

  //async functions
  async function getDestinationResult(data: GooglePlaceData) {
    //slight delay
    //sometimes doesnt always get called when clicked on
    const reversedDestinationLatLng = await getLatLngFromId(data.place_id);
    console.log("reversed: ", reversedDestinationLatLng);
    if (reversedDestinationLatLng != undefined) {
      setDestination({
        latitude: reversedDestinationLatLng.latitude,
        longitude: reversedDestinationLatLng.longitude,
        address: data.description,
        placeId: data.place_id,
      });
    }
  }

  async function getLatLngFromId(placeId: string) {
    //reverses geocoding
    try {
      const response = await axios.get(`https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${mapsApiKey}`);
      const jsonResultOject = response.data;
      console.log("result object:", jsonResultOject);
      const result = {
        latitude: jsonResultOject.location.latitude,
        longitude: jsonResultOject.location.longitude,
      };
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(`HTTP error: ${error.response.status}`);
        } else if (error.request) {
          console.error("Request error: No response received");
        } else {
          console.error("Error:", error.message);
        }
      } else {
        console.error("Non axios error:", error);
      }
    }
  }

  async function fetchRoutesFromServer(origin: LatLng, destination: LatLng): Promise<baseResultsCardType[]> {
    if (oneMapsAPIToken) {
      console.log(oneMapsAPIToken);
      try {
        const response = await axios.post(
          "https://nusmaps.onrender.com/transportRoute",
          {
            origin: origin,
            destination: destination,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: oneMapsAPIToken,
            },
          }
        );
        return response.data;
      } catch (error) {
        setRouteErrorMsg(`Unable to fetch route from server: ${error}`);
        console.error("Unable to fetch route from server. Please try again later: ", error);
        setIsLoading(false);
        throw new Error("Unable to fetch route from server. Please try again later: " + error);
      }
    } else {
      setRouteErrorMsg("Server issues, please try again later. API TOKEN ERROR");
      console.error("API token for OneMap not declared. Check server settings");
      setIsLoading(false);
      throw new Error("API token could not be found. Please try again");
    }
  }

  async function fetchBestRoute(originCoords: LatLng, destinationCoords: LatLng) {
    //fetches best route between two points, can pass a check to see if
    setIsLoading(true);
    const result = await fetchRoutesFromServer(originCoords, destinationCoords);
    // console.log("finally", result);
    setIsLoading(false);
    router.replace({
      pathname: "../routefindingScreens/ResultsScreen",
      params: {
        origin: JSON.stringify(originCoords),
        destination: JSON.stringify(destination),
        baseResultsData: JSON.stringify(result),
      },
    });
  }

  useImperativeHandle(ref, () => ({
    fetchRoutesFromServer,
    fetchBestRoute,
    getDestinationResult,
    getLatLngFromId,
    setDestination,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView style={styles.map} region={region} testID="current-location-map" userInterfaceStyle="light">
          {currentLocation && (
            <Marker
              testID="current-location-marker"
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Your Location"
            >
              <View>
                <CurrentLocationIcon />
              </View>
            </Marker>
          )}
        </MapView>
        <View style={styles.overlay}>
          <View style={{ paddingTop: "5%" }}>
            <RouteSearchBar location={currentLocation} getDestinationResult={getDestinationResult} testID="dest-search-bar" />
          </View>
        </View>
        <View style={styles.floatingButtonContainer}>
          <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} testID="current-location-button">
            <Animated.View style={[styles.floatingButton, { transform: [{ scale: scaleAnim }] }]}>
              <FontAwesome6 name="location-crosshairs" size={24} color="black" />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </GestureHandlerRootView>
  );
});

//stylesheet
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
  floatingButtonContainer: {
    position: "absolute",
    bottom: 30,
    right: 30,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
export default App;
