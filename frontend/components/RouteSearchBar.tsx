import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  GooglePlacesAutocomplete,
  GooglePlaceData,
} from "react-native-google-places-autocomplete";
import * as Location from "expo-location";

interface Coords {
  latitude: number;
  longitude: number;
}

interface RouteSearchBarInput {
  location: Location.LocationObjectCoords;
}

const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const REVERSEGEOCODINGURI = "https://maps.googleapis.com/maps/api/geocode/json";

const RouteSearchBar: React.FC<
  RouteSearchBarInput & {
    getDestinationResult: (data: GooglePlaceData) => void;
  }
> = ({ location, getDestinationResult }) => {
  const [currLocation, setCurrLocation] = useState<Coords>({
    latitude: 1.3521,
    longitude: 103.8198,
  });
  //shouldnt reverse the current location, just refer to current location as such
  useEffect(() => {
    if (location && Object.keys(location).length !== 0) {
      setCurrLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [""]);

  const queryParams = {
    key: apiKey,
    language: "en",
    location: {
      latitude: currLocation.latitude,
      longitude: currLocation.longitude,
    },
    radius: 5000,
    components: "country:sg",
    locationbias: `circle:1000@${currLocation.latitude},${currLocation.longitude}`,
    //might need current location to work more effectively
    //ideal is to click on result and for changeResultVisiblity to alter it
  };

  return (
    <View>
      <GooglePlacesAutocomplete
        placeholder="Search"
        onPress={(data) => {
          // 'details' is provided when fetchDetails = true
          getDestinationResult(data);
        }}
        query={queryParams}
        styles={{ textInputContainer: styles.googleSearchBar }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "#828282",
  },
  wrapperCustom: {
    borderRadius: 12,
    padding: 13,
    margin: 16,
    textAlign: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#828282",
  },
  googleSearchBar: {
    width: "90%",
    alignSelf: "center",
  },
});
export default RouteSearchBar;
