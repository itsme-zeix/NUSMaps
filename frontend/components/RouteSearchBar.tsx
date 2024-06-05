import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  GooglePlacesAutocomplete,
  GooglePlaceData,
} from "react-native-google-places-autocomplete";
import * as Location from "expo-location";

//interfaces
interface Coords {
  latitude: number;
  longitude: number;
}

interface RouteSearchBarInput {
  location: Location.LocationObjectCoords;
}

//constants
const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;

//The search bar itself
export const RouteSearchBar: React.FC<
  RouteSearchBarInput & {
    getDestinationResult: (data: GooglePlaceData) => void;
  }
> = ({ location, getDestinationResult }) => {
  //hooks
  const [currLocation, setCurrLocation] = useState<Coords>({
    latitude: 1.3521,
    longitude: 103.8198,
  });

  //effects
  useEffect(() => {
    //shouldnt reverse the current location, just refer to current location as such
    if (location && Object.keys(location).length !== 0) {
      setCurrLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [""]);

  //vars
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

//stylesheet
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