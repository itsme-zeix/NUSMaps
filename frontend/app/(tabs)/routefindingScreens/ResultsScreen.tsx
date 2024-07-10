import React from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Image,
  StatusBar,
  Platform,
  Pressable,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { LatLng } from "react-native-maps";
import Constants from "expo-constants";
import { SubwayTypeCard } from "@/components/detailedRouteScreen/SubwayType";
import { BusNumberCard } from "@/components/detailedRouteScreen/BusNumber";
import { useRouter, useLocalSearchParams, useSegments } from "expo-router";
import { TramTypeCard } from "@/components/detailedRouteScreen/TramNumber";

//interfaces and types
type destinationType = {
  address: string;
  placeId: string;
} & LatLng;

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
}

interface WalkLeg extends LegBase {
  walkInfo: {
    distance: number;
    direction: string;
  }[];
  distance: number;
}

interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  startingStopETA: number;
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  duration: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
}

type Leg = PublicTransportLeg | WalkLeg;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: string[]; //each leg's polyline is a string
  stopsCoordsArray: string[];
}

interface ResultObject {
  origin: LatLng;
  destination: destinationType;
  baseResultsData: baseResultsCardType[];
}

interface SingleResultCardData {
  origin: LatLng;
  destination: destinationType;
  resultData: baseResultsCardType;
}

interface IconCatalog {
  WALK: ImageSourcePropType;
  SUBWAY: ImageSourcePropType;
  BUS: ImageSourcePropType;
  TRAM: ImageSourcePropType;
  RCHEVRON: ImageSourcePropType;
  NUS_BUS: ImageSourcePropType;
}

//stores the paths of the chevrons
const iconList: IconCatalog = {
  WALK: require("@/assets/images/walk-icon.png"),
  SUBWAY: require("@/assets/images/subway-icon.png"),
  BUS: require("@/assets/images/bus-icon.png"),
  TRAM: require("@/assets/images/tram-icon.png"),
  RCHEVRON: require(`@/assets/images/chevron_right-icon.png`),
  NUS_BUS: require("@/assets/images/bus-icon.png"),
};

//constant variables
// const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
//USE THIS FOR PRODUCTION BUILDS
const apiKey = Constants.expoConfig.extra.EXPO_PUBLIC_MAPS_API_KEY;

//result card(singular card)
const ResultCard: React.FC<SingleResultCardData> = ({
  origin,
  destination,
  resultData,
}) => {
  //Put in a pressable that when expanded, will
  console.log("destination received in resultcard", destination);
  const types = resultData.types.flatMap((icon) => [icon, "RCHEVRON"]);
  types.splice(types.length - 1, 1); // remove the last chevron
  console.log(types);
  const router = useRouter();
  const segments = useSegments();
  console.log("curr path: ", segments.join("/"));
  const nextScreenFunc = () => {
    router.push({
      pathname: "../routefindingScreens/DetailedRouteScreen",
      params: {
        origin: JSON.stringify(origin),
        destination: JSON.stringify(destination),
        baseResultsCardData: JSON.stringify(resultData),
      },
    });
  };
  return (
    <Pressable
      style={[{ backgroundColor: "white" }, styles.resultCard]}
      onPress={nextScreenFunc}
    >
      <View>
        <View style={styles.icons}>
          {types.map((icon, index) => {
            if (icon === "BUS" || icon === "NUS_BUS") {
              const ptLeg = resultData.journeyLegs[
                index / 2
              ] as PublicTransportLeg;
              console.log("pt leg:", ptLeg);
              return (
                <View
                  key={index}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <BusNumberCard
                    busNumber={ptLeg.serviceType}
                    busType={ptLeg.type}
                  />
                </View>
              );
            } else if (icon === "SUBWAY") {
              const ptLeg = resultData.journeyLegs[
                index / 2
              ] as PublicTransportLeg;
              return (
                <View
                  key={index}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <SubwayTypeCard serviceType={ptLeg.serviceType} />
                </View>
              );
            } else if (icon === "TRAM") {
              const ptLeg = resultData.journeyLegs[
                index / 2
              ] as PublicTransportLeg;
              return (
                <View
                  key={index}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <TramTypeCard serviceType={ptLeg.serviceType} />
                </View>
              );
            } else {
              return (
                <Image
                  key={index}
                  source={iconList[icon as keyof IconCatalog]}
                  style={{ flexDirection: "row", alignItems: "center" }}
                />
              );
            }
          })}
          <Text>{resultData.wholeJourneyTiming}</Text>
        </View>
        <Text style={styles.travelDuration}>{resultData.journeyTiming}</Text>
      </View>
    </Pressable>
  );
};

//   ResultObject & {
//     isVisible: boolean;
//     setIsVisible: (isVisible: boolean) => void;
//   }
// result screen
const _parseParams = (result: string | string[] | undefined) => {
  return typeof result === "string" ? JSON.parse(result) : undefined;
};

const RefactoredResultsScreen: React.FC = () => {
  const { origin, destination, baseResultsData } = useLocalSearchParams();
  const queryParams = {
    key: apiKey,
    language: "en",
    radius: 5000,
    components: "country:sg",
  };
  console.log("base result cards data:", baseResultsData);
  const parsedOrigin = _parseParams(origin);
  const parsedDestination = _parseParams(destination);
  const parsedBaseResultsData = _parseParams(baseResultsData);
  console.log("dest", parsedDestination);
  if (parsedOrigin && parsedDestination && parsedBaseResultsData) {
    const typeCastedBaseResultsCard: baseResultsCardType[] =
      parsedBaseResultsData;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ backgroundColor: "white" }}>
          <StatusBar></StatusBar>
          <View style={styles.doubleSearchBarsContainer}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <GooglePlacesAutocomplete
                placeholder="Current location"
                query={{ queryParams }}
                textInputProps={{
                  placeholderTextColor: "#3987FF",
                  enterKeyHint: "search",
                }}
                styles={{
                  container: styles.topGoogleSearchBar,
                  textInputContainer: styles.googleSearchBarTextContainer,
                }}
              />
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <GooglePlacesAutocomplete
                placeholder={parsedDestination.address}
                query={{ queryParams }}
                textInputProps={{
                  placeholderTextColor: "#000000",
                  enterKeyHint: "search",
                }}
                styles={{
                  container: styles.bottomGoogleSearchBar,
                  textInputContainer: styles.googleSearchBarTextContainer,
                }}
              />
            </View>
          </View>
          <ScrollView>
            <View style={styles.resultContainer}>
              {typeCastedBaseResultsCard.map((data, index) => (
                <ResultCard
                  key={index}
                  origin={parsedOrigin}
                  resultData={data}
                  destination={parsedDestination}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
};
//PUT a next ETA timing in the detailed screen then build
//stylesheet
const styles = StyleSheet.create({
  topGoogleSearchBar: {
    marginTop: "5%",
    width: "93%",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 3 },
  },
  bottomGoogleSearchBar: {
    paddingTop: 5,
    width: "93%",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 3 },
  },
  googleSearchBarTextContainer: {
    textAlign: "center",
  },
  doubleSearchBarsContainer: {
    height: 150,
    marginTop: Platform.OS === "ios" ? 20 : StatusBar.currentHeight,
    paddingTop: 18,
    width: "100%",
    justifyContent: "center",
    alignContent: "flex-start",
  },
  resultContainer: {
    width: "100%",
    height: "60%",
    top: 1,
    flex: 1,
    marginTop: 50,
    marginBottom: 50,
    justifyContent: "flex-start",
    alignContent: "flex-start",
    alignItems: "center",
  },
  resultCard: {
    //has two children, transport routes, and the timing on the end
    height: 150,
    width: "93%",
    marginTop: 30,
    justifyContent: "space-evenly",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#828282",
  },
  icons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "white",
  },
  travelDuration: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
export default RefactoredResultsScreen;