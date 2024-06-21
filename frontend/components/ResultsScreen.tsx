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
import Modal from "react-native-modal";
import Constants  from "expo-constants";
import { SubwayTypeCard } from "@/app/(tabs)/SubwayType";
import { BusNumberCard } from "@/app/(tabs)/BusNumber";
import { Link } from 'expo-router';

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
    "distance":string,
    "direction":string;
  }[],
};
interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  totalTimeTaken: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng:LatLng[];
};
type Leg = PublicTransportLeg | WalkLeg;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: number[];
};

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
}

//stores the paths of the chevrons
const iconList: IconCatalog = {
  WALK: require("../assets/images/walk_icon.png"),
  SUBWAY: require("../assets/images/subway_icon.png"),
  BUS: require("../assets/images/bus_icon.png"),
  TRAM: require("../assets/images/tram_icon.png"),
  RCHEVRON: require(`../assets/images/chevron_right_icon.png`),
};

//constant variables
const apiKey = Constants.expoConfig.extra.EXPO_PUBLIC_MAPS_API_KEY;


//result card(singular card)
const ResultCard: React.FC<SingleResultCardData> = ({ origin, destination, resultData }) => {
  //Put in a pressable that when expanded, will 
  const types = resultData.types.flatMap((icon) => [icon, "RCHEVRON"]);
  types.splice(types.length - 1, 1); // remove the last chevron
  console.log('ok');
  console.log(types);
  return (
    <Link href = {{
      pathname: "/DetailedRouteScreen",
      params: {baseResultsCardData: JSON.stringify(resultData), destination: JSON.stringify(destination), origin:JSON.stringify(origin)}
    }}
    asChild style={styles.resultCard}>
      <Pressable style = {{backgroundColor:"green"}} >
        <View>
          <View style={styles.icons}>
            {types.map((icon, index) => {
              if (icon === "BUS") {
                const ptLeg = resultData.journeyLegs[index/2] as PublicTransportLeg;
                return (<View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BusNumberCard busNumber={ptLeg.serviceType}/>
                  </View>)
              } else if (icon === "SUBWAY") {
                const ptLeg = resultData.journeyLegs[index/2] as PublicTransportLeg;
                return (<View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <SubwayTypeCard serviceType={ptLeg.serviceType}/>
                  </View>)
              } else {
                return(<Image key={index} source={iconList[icon as keyof IconCatalog]} style={{ flexDirection: "row", alignItems: "center" }}/>);
              }})}
            <Text>{resultData.wholeJourneyTiming}</Text>
            </View>
          <Text style={styles.travelDuration}>{resultData.journeyTiming}</Text>
          </View>
        </Pressable>
    </Link>
  )
};

// result screen 
export const ResultScreen: React.FC<
  ResultObject & {
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
  }
> = ({ origin, destination, baseResultsData, isVisible, setIsVisible }) => {
  const queryParams = {
    key: apiKey,
    language: "en",
    radius: 5000,
    components: "country:sg",
  };
  if (isVisible) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <Modal
            isVisible={isVisible}
            animationInTiming={200}
            onBackdropPress={() => setIsVisible(false)}
            onBackButtonPress={() => setIsVisible(false)}
            hideModalContentWhileAnimating={true}
            backdropOpacity={1}
            backdropColor="white"
          >
            <View style={{ flex: 1 }}>
              <StatusBar></StatusBar>
              <View style={styles.doubleSearchBarsContainer}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <GooglePlacesAutocomplete
                    placeholder="Current location"
                    query={{ queryParams }}
                    styles={{
                      container: styles.googleSearchBar,
                      textInputContainer: styles.googleSearchBarTextContainer,
                    }}
                  />
                </View>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <GooglePlacesAutocomplete
                    placeholder={destination.address}
                    query={{ queryParams }}
                    styles={{
                      container: styles.googleSearchBar,
                      textInputContainer: styles.googleSearchBarTextContainer,
                    }}
                  />
                </View>
              </View>
              <View style={styles.resultContainer}>
                {baseResultsData.map((data, index) => (
                  <ResultCard key={index} origin={origin} resultData={data} destination = {destination}/>
                ))}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    return;
  }
};

//stylesheet
const styles = StyleSheet.create({
  googleSearchBar: {
    marginTop: 5,
    marginBottom: 5,
    paddingTop: 5,
    paddingBottom: 5,
    width: "100%",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#828282",
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
    width: "100%",
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
    backgroundColor:"red"
  },
  travelDuration: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

