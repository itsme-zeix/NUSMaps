import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Modal from "react-native-modal";

interface Coords {
  latitude: number;
  longitude: number;
}

type destinationLocation = {
  address: string;
  placeId: string;
};

interface ResultObject {
  origin: Coords;
  destination: destinationLocation;
  departureTiming: string;
  arrivalTiming: string;
  travelTime: string; // format of 1 hr 29 min
  types: string[]; //format of ['walk', 'train', 'walk']
}

interface IconCatalog {
  walk: ImageSourcePropType;
  train: ImageSourcePropType;
  bus: ImageSourcePropType;
  rchevron: ImageSourcePropType;
}

const iconList: IconCatalog = {
  walk: require("../assets/images/walk_icon.png"),
  train: require("../assets/images/subway_icon.png"),
  bus: require("../assets/images/bus_icon.png"),
  rchevron: require(`../assets/images/chevron_right_icon.png`),
};

const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const resultCard: React.FC<ResultObject> = ({
  departureTiming,
  arrivalTiming,
  travelTime,
  types,
}) => {
  types = types.flatMap((icon) => [icon, "rchevron"]);
  types.splice(types.length - 1, 1); // remove the last chevron
  console.log(types);
  return (
    <View style={styles.resultCard}>
      <View style={styles.icons}>
        {types.map((icon, index) => (
          <Image
            key={index}
            source={iconList[icon as keyof IconCatalog]}
            style={{ flexDirection: "row", alignItems: "center" }}
          />
        ))}
        <Text>
          {departureTiming} - {arrivalTiming}
        </Text>
      </View>
      <Text style={styles.travelTimings}>{travelTime}</Text>
    </View>
  );
};

const ResultScreen: React.FC<
  ResultObject & {
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
    origin: Coords; //should contain a name to display ideally
    destination: destinationLocation;
  }
> = ({
  origin,
  destination,
  departureTiming,
  arrivalTiming,
  travelTime,
  types,
  isVisible,
  setIsVisible,
}) => {
  const queryParams = {
    key: apiKey,
    language: "en",
    // location: {
    // latitude: current_origin.latitude,
    // longitude: current_origin.longitude,
    // },
    radius: 5000,
    components: "country:sg",
    // locationbias: `circle:1000@${current_origin.latitude},${current_origin.longitude}`,
    //might need current location to work more effectively
    //ideal is to click on result and for changeResultVisiblity to alter it
  };
  const [originText, onChangeOrigin] = React.useState(""); //should change the default value
  if (isVisible) {
    return (
      <SafeAreaView>
        <ScrollView style={{ flex: 1 }}>
          <Modal
            isVisible={isVisible}
            animationInTiming={200}
            onBackdropPress={() => setIsVisible(false)}
            onBackButtonPress={() => setIsVisible(false)}
            hideModalContentWhileAnimating={true}
            backdropOpacity={1.0}
            backdropColor="white"
            style={styles.resultContainer}
          >
            <GooglePlacesAutocomplete
              placeholder="Current location"
              query={{ queryParams }}
              styles={{
                container: styles.googleSearchBarContainer,
                textInputContainer: {
                  borderWidth: 1,
                  borderColor: "black",
                  backgroundColor: "green",
                },
              }}
            />
            <GooglePlacesAutocomplete
              placeholder={destination.address}
              query={{ queryParams }}
              styles={{
                container: styles.googleSearchBarContainer,
                textInputContainer: {
                  borderWidth: 1,
                  borderColor: "black",
                  backgroundColor: "green",
                },
              }}
            />
            <View style={{ flex: 1, direction: "ltr", alignItems: "center" }}>
              {resultCard({
                origin,
                destination,
                departureTiming,
                arrivalTiming,
                travelTime,
                types,
              })}
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    return;
  }
};
//weird glitch
const styles = StyleSheet.create({
  googleSearchBarContainer: {
    marginTop: 5,
    backgroundColor: "red",
    height: 0,
    flex: 0.1,
  },
  resultContainer: {
    width: "100%",
    height: "100%",
    flex: 1,
    margin: 0,
    justifyContent: "flex-start",
  },
  resultCard: {
    //has two children, transport routes, and the timing on the end
    height: 80,
    width: "95%",
    borderBottomColor: "black",
    borderWidth: 1,
    justifyContent: "space-evenly",
    backgroundColor: "red",
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  travelTimings: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
export default ResultScreen;
