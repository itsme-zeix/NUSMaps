import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  View,
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

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
};

interface ResultObject {
  origin: Coords;
  destination: destinationLocation;
  baseResultsData: baseResultsCardType[];
};

interface OneResultsCardData {
  origin:Coords;
  resultData : baseResultsCardType;
}


interface IconCatalog {
  WALK: ImageSourcePropType;
  SUBWAY: ImageSourcePropType;
  BUS: ImageSourcePropType;
  RCHEVRON: ImageSourcePropType;
}

const iconList: IconCatalog = {
  WALK: require("../assets/images/walk_icon.png"),
  SUBWAY: require("../assets/images/subway_icon.png"),
  BUS: require("../assets/images/bus_icon.png"),
  RCHEVRON: require(`../assets/images/chevron_right_icon.png`),
};

const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const ResultCard: React.FC<OneResultsCardData> = ({ origin, resultData }) => {
  const types = resultData.types.flatMap((icon) => [icon, "RCHEVRON"]);
  types.splice(types.length - 1, 1); // remove the last chevron
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
        <Text>{resultData.wholeJourneyTiming}</Text>
      </View>
      <Text style={styles.travelTimings}>{resultData.journeyTiming}</Text>
    </View>
  );
};

const ResultScreen: React.FC<
  ResultObject & {
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;

  }
> = ({
  origin,
  destination,
  baseResultsData,
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
                },
              }}
            />
            <View style={{ flex: 1, direction: "ltr", alignItems: "center", }}>
            {baseResultsData.map((data, index) => (
              <ResultCard key={index} origin={origin} resultData={data}/>
            ))}
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
