import React, {forwardRef, useImperativeHandle } from "react";
import { StyleSheet, ScrollView, Text, View, Image, StatusBar, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker, LatLng, PROVIDER_GOOGLE } from "react-native-maps";
import Constants from "expo-constants";
import { SubwayTypeCard } from "@/components/detailedRouteScreen/SubwayType";
import { BusNumberCard } from "@/components/detailedRouteScreen/BusNumber";
import { TramTypeCard } from "@/components/detailedRouteScreen/TramNumber";
import { useRouter, useLocalSearchParams, useSegments } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { PublicTransportLeg, destinationType, baseResultsCardType, SingleResultCardData } from "@/types";

//interfaces and types

// Define a type for all possible icon names
type IconName = keyof typeof MaterialIcons.glyphMap;

interface IconCatalog {
  WALK: IconName;
  RCHEVRON: IconName;
}

// Define the icon list with the correct types
const iconList: IconCatalog = {
  WALK: "directions-walk",
  RCHEVRON: "chevron-right",
};

//constant variables
//USE THIS FOR PRODUCTION BUILDS
const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_API_KEY || Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLEMAPS_API_KEY;

//result card(singular card)
export const ResultCard = forwardRef((
  { origin, destination, resultData, testID }: SingleResultCardData & { testID: string },
  ref // Add ref parameter
) => {
  //Put in a pressable that when expanded, will
  // console.log("destination received in resultcard", destination);
  const types = resultData.types.flatMap((icon) => [icon, "RCHEVRON"]);
  types.splice(types.length - 1, 1); // remove the last chevron
  const router = useRouter();
  // const segments = useSegments();
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
  useImperativeHandle(ref, () => ({
    nextScreenFunc,
  }));
  return (
    <Pressable style={[{ backgroundColor: "white" }, styles.resultCard]} onPress={nextScreenFunc} testID={testID}>
      <View style={{ flexDirection: "column" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={styles.iconsContainer}>
            {types.map((icon, index) => {
              if (icon === "BUS" || icon === "NUS_BUS") {
                const ptLeg = resultData.journeyLegs[Math.floor(index / 2)] as PublicTransportLeg;
                return (
                  <View key={`bus-${index}`} style={styles.iconWrapper}>
                    <BusNumberCard busNumber={ptLeg.serviceType} busType={ptLeg.type} testID= {`${testID}-BusNumberCard-${index}`}/>
                  </View>
                ) 
              } else if (icon === "SUBWAY") {
                const ptLeg = resultData.journeyLegs[Math.floor(index / 2)] as PublicTransportLeg;
                return (
                  <View key={`subway-${index}`} style={styles.iconWrapper}>
                    <SubwayTypeCard serviceType={ptLeg.serviceType} testID= {`${testID}-SubwayTypeCard-${index}`} />
                  </View>
                );
              } else if (icon === "TRAM") {
                const ptLeg = resultData.journeyLegs[Math.floor(index / 2)] as PublicTransportLeg;
                return (
                  <View key={`tram-${index}`} style={styles.iconWrapper}>
                    <TramTypeCard serviceType={ptLeg.serviceType} testID= {`${testID}-TramTypeCard-${index}`}/>
                  </View>
                );
              } else {
                return (
                  <View key={`icon-${index}`} style={styles.iconWrapper} testID= {`${testID}-WalkOrChevronCard-${index}`}>
                    <MaterialIcons
                      key={`icon-${index}`}
                      size={22}
                      name={iconList[icon as keyof IconCatalog]}
                      color="#434343"
                      style={{ flexDirection: "row", alignItems: "center" }}
                    />
                  </View>
                );
              }
            })}
          </View>
          <View style={styles.travelDurationContainer}>
            <Text style={styles.travelDuration}>{resultData.journeyTiming}</Text>
          </View>
        </View>
      </View>
      <View style={styles.startAndEndTimeContainer}>
        <Text>{resultData.wholeJourneyTiming}</Text>
      </View>
    </Pressable>
  );
});


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
  // console.log("base result cards data:", baseResultsData);
  const parsedOrigin: LatLng = _parseParams(origin);
  const parsedDestination: destinationType = _parseParams(destination);
  const parsedBaseResultsData = _parseParams(baseResultsData);
  // console.log("dest", parsedDestination);
  if (parsedOrigin && parsedDestination && parsedBaseResultsData) {
    const typeCastedBaseResultsCard: baseResultsCardType[] = parsedBaseResultsData;
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <View style={{ flex: 1 }}>
          <View style={{ width: "100%", height: "50%" }}>
            <MapView
              style={{ width: "100%", height: "100%" }}
              userInterfaceStyle="light"
              initialRegion={{
                latitude: (parsedOrigin.latitude + parsedDestination.latitude) / 2,
                longitude: (parsedOrigin.longitude + parsedDestination.longitude) / 2,
                latitudeDelta: Math.abs(parsedOrigin.latitude - parsedDestination.latitude) * 2,
                longitudeDelta: Math.abs(parsedOrigin.longitude - parsedDestination.longitude) * 2,
              }}
            >
              <Marker
                title="Origin"
                coordinate={{
                  latitude: parsedOrigin.latitude,
                  longitude: parsedOrigin.longitude,
                }}
              />
              <Marker
                title="Destination"
                coordinate={{
                  latitude: parsedDestination.latitude,
                  longitude: parsedDestination.longitude,
                }}
              />
            </MapView>
          </View>
          <SafeAreaView style={styles.doubleSearchBarsContainer}>
            <View style={{ alignItems: "center" }}>
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
            <View style={{ alignItems: "center" }}>
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
          </SafeAreaView>
          <ScrollView>
            <View style={styles.resultContainer}>
              {typeCastedBaseResultsCard.map((data, index) => (
                <ResultCard key={`result-${index}`} origin={parsedOrigin} resultData={data} destination={parsedDestination} testID={`result-card-${index}`}/>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }
};
//PUT a next ETA timing in the detailed screen then build
//stylesheet
const styles = StyleSheet.create({
  topGoogleSearchBar: {
    width: "93%",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 3 },
  },
  bottomGoogleSearchBar: {
    paddingTop: 0,
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
    position: "absolute",
    width: "100%",
    justifyContent: "center",
    alignContent: "flex-start",
  },
  resultContainer: {
    width: "100%",
    height: "100%",
    top: 1,
    flex: 1,
    marginTop: 50,
    marginBottom: 50,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  resultCard: {
    //has two children, transport routes, and the timing on the end
    height: 150,
    width: "93%",
    marginTop: 18,
    paddingHorizontal: 10,
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
  },
  iconsContainer: {
    marginLeft: 5,
    marginTop: 15,
    maxWidth: "70%",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
  },
  iconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // Adjust this value to set the margin between wrapped lines
    marginRight: -4, // Optional: Add some space between icons in the same line
  },
  travelDurationContainer: {
    marginRight: 10,
    marginTop: 27,
  },
  travelDuration: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
  },
  startAndEndTimeContainer: {
    marginLeft: 5,
    marginBottom: 15,
  },
});
export default RefactoredResultsScreen;