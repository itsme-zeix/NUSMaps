import React, { useState } from "react";
import { StyleSheet, ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, LatLng, Callout } from "react-native-maps";
import { SubwayTypeCard } from "@/components/detailedRouteScreen/SubwayType";
import { BusNumberCard } from "@/components/detailedRouteScreen/BusNumber";
import { TramTypeCard } from "@/components/detailedRouteScreen/TramNumber";
import { useLocalSearchParams } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getColorForPublicTransport } from "@/utils/getColorForPublicTransport";

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
  startTime: number; //start and end time only defined for buses(+ nus buses) for now
  endTime: number;
  duration: number;
}

interface WalkLeg extends LegBase {
  walkInfo: {
    distance: number;
    direction: string;
  }[];
  distance: number;
}

type destinationType = {
  address: string;
  placeId: string;
} & LatLng;

interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  startingStopETA: number; //only defined for nus buses, for now
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  duration: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
}

type Leg = PublicTransportLeg | WalkLeg;

type stopCoords = {
  name: string;
} & LatLng;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: string[]; //each leg's polyline is a string
  stopsCoordsArray: string[];
}

interface PublicTransportLegContainerProps {
  ptLeg: PublicTransportLeg;
  legType: string;
  legHeight: number;
}

interface WalkLegContainerProps {
  walkLeg: WalkLeg;
  legHeight: number;
}

const polyline = require("@mapbox/polyline");

const OriginContainer: React.FC = () => {
  return (
    <View style={stylesheet.legContainer}>
      <View style={stylesheet.barContainer}>
        <View style={{ alignItems: "center" }}>
          <MaterialIcons name="my-location" size={20} color="#1B73E9" />
        </View>
      </View>
      <View style={stylesheet.legDetails}>
        <Text style={{ fontFamily: "Inter-SemiBold" }}>Current Location</Text>
      </View>
    </View>
  );
};

const DestinationContainer = ({ destination }: { destination: destinationType }) => {
  return (
    <View style={stylesheet.legContainer}>
      <View style={stylesheet.barContainer}>
        <View style={{ alignItems: "center" }}>
          <MaterialIcons name="location-pin" size={20} color="crimson" />
        </View>
      </View>
      <View style={stylesheet.legDetails}>
        <Text style={{ fontFamily: "Inter-SemiBold" }}>{destination.address}</Text>
      </View>
    </View>
  );
};

const formatIntoMinutesAndSeconds = (timingInSeconds: number) => {
  const seconds = Math.round(timingInSeconds % 60);
  const minutes = Math.floor(timingInSeconds / 60);
  const minutesRoundedUp = minutes + 1;

  if (minutes !== 0) {
    return `${minutesRoundedUp} min`;
  }
  return `${seconds} second`;
};

const formatDistance = (distance: number): string => {
  if (distance < 100) {
    return `${Math.round(distance)}m`;
  } else if (distance < 1000) {
    return `${Math.round(distance / 10) * 10}m`;
  } else {
    return `${(Math.round(distance / 100) / 10).toFixed(1)}km`;
  }
};

const PublicTransportLegContainer: React.FC<PublicTransportLegContainerProps> = ({ ptLeg, legType, legHeight }) => {
  const [expanded, setExpanded] = useState(false);

  const lineHeight = 18; // Adjusts the distance between each bus stop when bus route is expanded
  const adjustedHeight = expanded ? legHeight + (ptLeg.intermediateStopCount - 1) * lineHeight : legHeight;

  const legColor = getColorForPublicTransport(legType, ptLeg.serviceType);

  return (
    <View style={stylesheet.legContainer}>
      {/* Graphics on the left of the stop information */}
      <View style={[{ position: "relative" }, stylesheet.barContainer]}>
        <View style={{ justifyContent: "flex-start", alignItems: "center" }}>
          <View style={[{ position: "absolute", zIndex: 1 }, stylesheet.circleIcon]}>
            {legType === "BUS" || legType === "NUS_BUS" ? (
              <MaterialIcons name="directions-bus" size={17} color="#3D3F43" />
            ) : legType === "TRAM" ? (
              <MaterialIcons name="tram" size={17} color="#3D3F43" />
            ) : legType === "SUBWAY" ? (
              <MaterialIcons name="subway" size={17} color="#3D3F43" />
            ) : legType === "TRAIN" ? (
              <MaterialIcons name="train" size={17} color="#3D3F43" />
            ) : null}
          </View>
          <View
            style={[
              stylesheet.solidRectangle,
              { position: "relative", top: 10, height: adjustedHeight + 15, backgroundColor: legColor },
            ]}
          />
          <View style={[stylesheet.miniCircleIcon, { position: "relative", bottom: 4.5 }]} />
        </View>
      </View>

      {/* Stop information */}
      <View style={stylesheet.legDetails}>
        <Pressable onPress={() => console.log("route pressed!")}>
          <Text style={{ fontFamily: "Inter-SemiBold", marginTop: 4, marginBottom: 8 }}>{ptLeg.startingStopName}</Text>

          {/* Logo that shows icon and bus/train service number below the starting stop's name */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
            {ptLeg.type === "SUBWAY" && <SubwayTypeCard serviceType={ptLeg.serviceType} testID={""} />}
            {(ptLeg.type === "BUS" || ptLeg.type === "NUS_BUS") && (
              <BusNumberCard busNumber={ptLeg.serviceType} busType={ptLeg.type} testID={""} />
            )}
            {ptLeg.type === "NUS_BUS" && (
              <Text style={{ marginHorizontal: 4, fontFamily: "Inter-Regular" }}>
                Next bus: {formatIntoMinutesAndSeconds(ptLeg.startingStopETA)}
              </Text>
            )}
            {ptLeg.type === "WALK" && <View />}
            {ptLeg.type === "TRAM" && <TramTypeCard serviceType={ptLeg.serviceType} testID={""} />}
          </View>

          {/* Expandable view of intermediate stops */}
          <View style={{ flexDirection: "column" }}>
            <View style={{ marginBottom: 5 }}>
              <Pressable onPress={() => setExpanded(!expanded)}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={20} color="#434343" />
                  <Text style={{ fontFamily: "Inter-Regular" }}>
                    Ride {ptLeg.intermediateStopCount} stops ({Math.ceil(ptLeg.duration / 60)} min)
                  </Text>
                </View>
              </Pressable>
              {expanded && (
                <View>
                  {ptLeg.intermediateStopNames.map((stop, index) => (
                    <Text key={index} style={{ fontFamily: "Inter-Regular", lineHeight: lineHeight }}>
                      {stop}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            <Text style={{ fontFamily: "Inter-SemiBold" }}>{ptLeg.destinationStopName}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const WalkLegContainer: React.FC<WalkLegContainerProps> = ({ walkLeg, legHeight }) => {
  //TO-DO: Add details on turns
  let legDistanceDefined = walkLeg.distance !== undefined;

  return (
    legDistanceDefined && (
      <View style={stylesheet.legContainer}>
        <View style={stylesheet.barContainer}>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <View style={[{ height: legHeight }, stylesheet.dotContainer]}>
              {Array.from({ length: Math.ceil(legHeight / 14) }).map((_, i) => (
                <View key={i} style={stylesheet.dot} />
              ))}
            </View>
            <MaterialIcons name="directions-walk" size={17} />
            <View style={[{ height: legHeight }, stylesheet.dotContainer]}>
              {Array.from({ length: Math.ceil(legHeight / 14) }).map((_, i) => (
                <View key={i} style={stylesheet.dot} />
              ))}
            </View>
          </View>
        </View>
        <View style={[stylesheet.legDetails]}>
          <Pressable onPress={() => console.log("Route pressed!")}>
            <Text style={{ fontFamily: "Inter-Regular" }}>
              Walk for {formatDistance(walkLeg.distance)} ({formatIntoMinutesAndSeconds(walkLeg.duration)})
            </Text>
          </Pressable>
        </View>
      </View>
    )
  );
};

const DetailedRouteScreen: React.FC = () => {
  //add a base current location and end flag
  const params = useLocalSearchParams();

  let destination: destinationType = JSON.parse(params.destination as string);
  let origin: LatLng = JSON.parse(params.origin as string);
  if (params.baseResultsCardData == undefined) {
    console.error("no base results received");
    return;
  }
  const baseResultsCardData: baseResultsCardType = JSON.parse(params.baseResultsCardData as string);
  let polylineArray: string[] = [];
  if (
    baseResultsCardData.polylineArray == undefined &&
    origin.latitude != destination.latitude &&
    origin.longitude != destination.longitude
  ) {
    console.error("no routing received despite differing origins and destination");
  } else {
    polylineArray = baseResultsCardData.polylineArray;
  }
  let formatted_array: LatLng[] = [];
  // for (let step = 0; step < polylineArray.length; step += 1) {
  //   const decodedPolyLineArray = polyline.decode(polylineArray[step]);
  //   decodedPolyLineArray.map((latLngPair: number[]) => formatted_array.push({
  //     latitude: latLngPair[0],
  //     longitude: latLngPair[1]
  //   }));
  // }
  for (let arr of polyline.decode(polylineArray)) {
    formatted_array.push({
      latitude: arr[0],
      longitude: arr[1],
    });
  }
  const stopsCoordsArray: stopCoords[] = baseResultsCardData.stopsCoordsArray.map((str) => {
    return JSON.parse(str);
  });

  return (
    <View style={stylesheet.SafeAreaView} testID="SafeAreaView">
      <MapView
        style={stylesheet.MapView}
        userInterfaceStyle="light"
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 2,
          longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 2,
        }}
        testID="mapview"
      >
        {polylineArray.length > 0 && (
          <>
            {/* Outline Polyline */}
            <Polyline
              coordinates={formatted_array}
              strokeWidth={8} // Slightly thicker to act as the outline
              strokeColor="#368E20" // Outline color
              lineJoin="bevel"
              zIndex={1} // Lower zIndex
            />
            {/* Main Polyline */}
            <Polyline
              coordinates={formatted_array}
              strokeWidth={6.5} // Main polyline width
              strokeColor="#53D733" // Main polyline color
              lineJoin="bevel"
              zIndex={2} // Slightly higher zIndex to be on top of the outline
              testID="mapview-polyline"
            />
          </>
        )}

        {stopsCoordsArray.map((stop, index) => {
          if (stop.name != "Origin" && stop.name != "Destination") {
            return (
              <Marker
                title={stop.name}
                key={index}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                zIndex={3} // higher zIndex for circles but lower than origin/dest markers
              >
                <View
                  style={{
                    position: "relative",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 40,
                    height: 40,
                  }}
                >
                  <MaterialIcons name="circle" size={10} color="#black" />
                  <MaterialIcons
                    name="circle"
                    size={7}
                    color="white"
                    style={{ position: "absolute", zIndex: 2, elevation: 2 }}
                  />
                </View>
              </Marker>
            );
          }
        })}

        <Marker
          title="Origin"
          coordinate={{
            latitude: origin.latitude,
            longitude: origin.longitude,
          }}
          testID="origin-marker"
          opacity={1}
        ></Marker>

        <Marker
          title="Destination"
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          opacity={1}
        ></Marker>
      </MapView>

      <ScrollView style={{ flex: 1, backgroundColor: "white", marginHorizontal: 20 }}>
        <View style={{ marginVertical: 15 }}>
          <View style={{ flexDirection: "row" }}>
            <OriginContainer />
          </View>

          {baseResultsCardData.journeyLegs.map((leg, index) => {
            let legHeight = leg.type === "WALK" ? 28 : 80; // Adjust these values as needed
            return (
              <React.Fragment key={index}>
                <View style={{ flexDirection: "row" }}>
                  {(leg.type === "BUS" || leg.type === "SUBWAY" || leg.type === "NUS_BUS" || leg.type === "TRAM") && (
                    <PublicTransportLegContainer
                      ptLeg={leg as PublicTransportLeg}
                      legHeight={legHeight}
                      legType={leg.type}
                    />
                  )}
                  {leg.type === "WALK" && <WalkLegContainer walkLeg={leg as WalkLeg} legHeight={legHeight} />}
                </View>
              </React.Fragment>
            );
          })}
          <DestinationContainer destination={destination} />
        </View>
      </ScrollView>
    </View>
  );
};

const stylesheet = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
    width: "100%",
    backgroundColor: "white",
  },
  MapView: {
    flex: 1,
    height: "30%",
    width: "100%",
  },
  resultContainer: {
    flex: 1,
    flexDirection: "column",
  },
  legContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  barContainer: {
    justifyContent: "flex-start",
    flexDirection: "column",
    width: 25,
    height: "100%",
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "grey",
  },
  solidRectangle: {
    width: 17,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  dotContainer: {
    justifyContent: "space-around",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DADBE1",
  },
  circleIcon: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1, // Add elevation for Android
  },
  miniCircleIcon: {
    width: 9,
    height: 9,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  legDetails: {
    justifyContent: "flex-start",
    marginHorizontal: 10,
  },
});

export default DetailedRouteScreen;
