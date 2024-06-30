import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  LatLng,
} from "react-native-maps";
import * as Location from "expo-location";
import { RouteSearchBar } from "@/components/RouteSearchBar";
import Toast from "react-native-toast-message";
import { ResultScreen } from "@/components/ResultsScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlaceData } from "react-native-google-places-autocomplete";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

//interface and types

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
}
interface WalkLeg extends LegBase {
  walkInfo: {
    distance: string;
    direction: string;
  }[];
};

interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  startingStopETA: number,
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  duration: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
};

type Leg = PublicTransportLeg | WalkLeg;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: string[]; //each leg's polyline is a string
  stopsCoordsArray: string[]
};

type DestinationResult = {
  address: string;
  placeId: string;
} & LatLng;

//constants and variables
// const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY;
//USE THIS FOR PRODUCTION BUILDS 
const mapsApiKey = Constants.expoConfig.extra.EXPO_PUBLIC_MAPS_API_KEY;
const oneMapsAPIToken = Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN;
//exporter
export default function App() {
  //hooks
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
  const [routeErrorMsg, setRouteErrorMsg] = useState("");
  const DEFAULTDESTINATIONLatLng = {
    latitude: NaN,
    longitude: NaN,
    address: "DEFAULT",
    placeId: "DEFAULT",
  };
  const [destination, setDestination] = useState<DestinationResult>(
    DEFAULTDESTINATIONLatLng
  );
  const [baseResultsCardData, setbaseResultsCardData] = useState<
    //the results needed to be displayed
    baseResultsCardType[]
  >([]);
  const isNotInitialExec = useRef(false);

  //effects arranged in execution order
  //flow goes as follows: (1) Location Permissions + Denial error mesages
  //(2)Location error messages even when current permission is enabled
  //(3)Route error messages when unable to query backend
  //(4) State changes when user inputs a new destination, leading to a new visible modal
  //(5)
  useEffect(() => {
    //to query for location permission
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

  useEffect(() => {
    // Toast to display error from denial of gps permission
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
    //to change when the destination state changes due to search bar having user input
    if (destination.address !== "DEFAULT") {
      setisResultAttained(true);
    }
  }, [destination]);

  useEffect(() => {
    //function that is executed when destination is changed (a new search result is attained)
    if (isNotInitialExec.current && destination !== DEFAULTDESTINATIONLatLng) {
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
    setDestination({
      latitude: reversedDestinationLatLng.latitude,
      longitude: reversedDestinationLatLng.longitude,
      address: data.description,
      placeId: data.place_id,
    });
  }

  async function getLatLngFromId(placeId: string) {
    //reverses geocoding
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${mapsApiKey}`
    );
    if (response.status === 200) {
      const jsonObject = await response.json();
      const result = {
        latitude: jsonObject.location.latitude,
        longitude: jsonObject.location.longitude,
      };
      return result;
    } else {
      throw new Error(
        `Error fetching destination's coordinates: ${response.status}`
      );
    }
  }

  async function fetchRoutesFromServer(
    origin: LatLng,
    destination: LatLng
  ): Promise<baseResultsCardType[]> {
    if (oneMapsAPIToken) {
      try {
        console.log("Origin location:", origin);
        const data = await fetch(
          "https://nusmaps.onrender.com/transportRoute",
          {
            method: "POST",
            body: JSON.stringify({
              origin: origin,
              destination: destination,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: oneMapsAPIToken,
              //or use this for authorization when building Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN
            },
          }
        );
        return data.json();
      } catch (error) {
        setRouteErrorMsg("Server issues, please try again later.");
        console.error("Route could not be found. Please try again later: ", error
        );
        throw new Error("Route could not be found. Please try again later");
      }
    } else {
      setRouteErrorMsg("Server issues, please try again later.");
      console.error("api token for OneMap not declared. Check server settings");
      throw new Error("API token could not be found. Please try again");
    }
  }

  async function fetchBestRoute(origin: LatLng, destination: LatLng) {
    //fetches best route between two points, can pass a check to see if
    // const {data, error, isLoading} = useQuery({queryKey:['routeData', origin, destination], queryFn:() => fetchRoutesFromServer(origin, destination)});
    // if (isLoading) {
    // console.log("loading...");
    // };
    // if (error) {
    // console.error("Couldn't fetch best route from server");
    // } else if (data) {
    // setbaseResultsCardData(data);
    // }
    //issue: Timing issue +
    try {
      const result = await fetchRoutesFromServer(origin, destination);
      console.log("finally", result);
      setbaseResultsCardData(result);
    } catch (error) {
      console.error("parsing error: ", error);
      setRouteErrorMsg("service not available, please try again");
    }
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
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
            destination={destination}
            baseResultsData={baseResultsCardData}
            isVisible={isResultAttained}
            setIsVisible={setisResultAttained}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

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
});
