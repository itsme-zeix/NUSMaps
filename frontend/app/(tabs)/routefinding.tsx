import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { RouteSearchBar } from "@/components/RouteSearchBar";
import Toast from "react-native-toast-message";
import { ResultScreen } from "@/components/ResultsScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GooglePlaceData } from "react-native-google-places-autocomplete";
import { format } from "date-fns";

//interface and types
type destinationLocation = {
  address: string;
  placeId: string;
};

interface Coords {
  latitude: number;
  longitude: number;
}

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
}

//constants and variables
const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const oneMapsApiKey = process.env.EXPO_PUBLIC_ONEMAPS_API_KEY;

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
  const [destination, setDestination] = useState<destinationLocation>({
    address: "DEFAULT",
    placeId: "DEFAULT",
  });
  const [baseResultsCardData, setbaseResultsCardData] = useState<
    baseResultsCardType[]
  >([]);
  
  //effects
  useEffect(() => {   
    //to change when the destination changes
    if (destination.address !== "DEFAULT") {
      setisResultAttained(true);
    }
  }, [destination]);
  
  useEffect(() => {
    //shows toast when onemap api doesn't return a result
    if (routeErrorMsg !== "") {
      setisResultAttained(false);
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please try again later when public transport is available",
        position: "top",
        autoHide: true,
      });
    }
  });

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

  //async functions
  async function getDestinationResult(data: GooglePlaceData) {
    //slight delay
    await getBestRoute(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      await getCoordsFromId(data.place_id)
    ); //this will return back the gps coordinates which are then sent to the api
    setDestination({ address: data.description, placeId: data.place_id });
  }

  async function getCoordsFromId(placeId: string) {
    //reverses geocoding 
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${apiKey}`
    );
    if (response.status === 200) {
      const jsonObject = await response.json();
      const result = {
        latitude: jsonObject.location.latitude,
        longitude: jsonObject.location.longitude,
      };
      // console.log(result);
      return result;
    } else {
      throw new Error(
        `Error fetching destination's coordinates: ${response.status}`
      );
    }
  }
  
  async function getBestRoute(origin: Coords, destination: Coords) {
    //fetches best route between two points, can pass a check to see if 
    try {
      const dateObject = new Date();
      let date = format(dateObject, "MM-dd-yyyy");
      let time = format(dateObject, "HH:MM:SS");
      const routesUrl = encodeURI(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=3`
      );

      const headers = {
        Authorization: `${oneMapsApiKey}`,
      };

      const response = await fetch(routesUrl, {
        method: "GET",
        headers: headers,
      });
      const route = await response.json();
      //to populate types, ideal will be to add more

      const bestPaths = route.plan.itineraries;
      const baseCardResultsDataStorage: baseResultsCardType[] = [];
      for (let index = 0; index < bestPaths.length; index++) {
        let currPath = bestPaths[index];
        let typesArr: string[] = [];
        console.log(currPath.legs[0].mode);
        typesArr = currPath.legs.map((leg) => leg.mode);
        const rightSideTiming = formatBeginningEndingTime(
          currPath.startTime,
          currPath.endTime
        );
        const leftSideTiming = formatJourneyTime(currPath.duration);
        baseCardResultsDataStorage.push({
          types: typesArr,
          wholeJourneyTiming: rightSideTiming,
          journeyTiming: leftSideTiming,
        });
      }
      setbaseResultsCardData(baseCardResultsDataStorage);
      console.log(baseResultsCardData);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setRouteErrorMsg(`Error fetching data: ${error}`);
    }
  };

  //synchronous functions
  const formatBeginningEndingTime = (
    startTiming: number,
    endTiming: number
  ) => {
    const formattedStartTiming = format(new Date(startTiming), "hh:mm a");
    const formattedEndTiming = format(new Date(endTiming), "hh:mm a");
    return `${formattedStartTiming} - ${formattedEndTiming}`;
  };

  const formatJourneyTime = (time: number) => {
    console.log(time);
    const intermediate = Math.floor(time / 60);
    const hours = Math.floor(intermediate / 60);
    const minutes = Math.floor(intermediate % 60);
    if (hours < 1) {
      return `${minutes} min`;
    }
    return `${hours} hrs ${minutes}min `;
    //weird visual bug
  };

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
            destination={destination}
            baseResultsData={baseResultsCardData}
            isVisible={isResultAttained}
            setIsVisible={setisResultAttained}
          />
        </View>
      </View>
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
