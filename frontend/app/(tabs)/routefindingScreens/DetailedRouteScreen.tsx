import React, { useState } from "react";
import { StyleSheet, ScrollView, Text, View, Image, Pressable, ImageURISource } from "react-native";
import { ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline, LatLng, Callout } from "react-native-maps";
import { SubwayTypeCard } from "@/components/detailedRouteScreen/SubwayType";
import { BusNumberCard } from "@/components/detailedRouteScreen/BusNumber";
import { TramTypeCard } from "@/components/detailedRouteScreen/TramNumber";
import { useLocalSearchParams } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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

interface IconCatalog {
  MARKER: ImageSourcePropType;
  STOPCIRCULARMARKER: ImageURISource;
}

const iconList: IconCatalog = {
  MARKER: require("@/assets/images/location-icon.png"),
  STOPCIRCULARMARKER: require("@/assets/images/mapCircle-icon.png"),
};

interface PublicTransportLegProps {
  ptLeg: PublicTransportLeg;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

interface WalkLegProps {
  walkLeg: WalkLeg;
  legHeight: number;
}

const polyline = require("@mapbox/polyline");

const OriginRectangle: React.FC = () => {
  return (
    <View style={stylesheet.barContainer}>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={stylesheet.circleIconWrapper}>
          <MaterialIcons name="my-location" size={20} color="#1B73E9" />
        </View>
      </View>
    </View>
  );
};

const DestinationRectangle: React.FC = () => {
  return (
    <View style={stylesheet.barContainer}>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={stylesheet.circleIconWrapper}>
          <MaterialIcons name="location-pin" size={20} color="crimson" />
        </View>
      </View>
    </View>
  );
};

interface LegRectangleProps {
  height: number;
  legType: string;
  expanded: boolean;
  leg: Leg;
}

const LegRectangle: React.FC<LegRectangleProps> = ({ height, legType, expanded, leg }) => {
  const isWalk = legType === "WALK";

  // Type guard to allow for intermediateStopCount to be called.
  function isPublicTransportLeg(leg: any): leg is PublicTransportLeg {
    return leg && typeof leg.intermediateStopCount === "number";
  }

  // Use the type guard to assert leg type
  const adjustedHeight = isWalk ? height : isPublicTransportLeg(leg) && expanded ? height + (leg.intermediateStopCount - 1) * 16 : height; // lineHeight = 16 set in publicTransportLegPart

  return (
    <View style={stylesheet.barContainer}>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        {isWalk && (
          <View style={[{ height }, stylesheet.dotContainer]}>
            {Array.from({ length: Math.ceil(height / 15) }).map((_, i) => (
              <View key={i} style={stylesheet.dot} />
            ))}
          </View>
        )}
        <View style={stylesheet.circleIconWrapper}>{isWalk ? <MaterialIcons name="directions-walk" size={20} /> : legType === "BUS" ? <MaterialIcons name="directions-bus" size={20} /> : legType === "NUS_BUS" ? <MaterialIcons name="directions-bus" size={20} /> : legType === "TRAM" ? <MaterialIcons name="tram" size={20} /> : legType === "SUBWAY" ? <MaterialIcons name="subway" size={20} /> : legType === "TRAIN" ? <MaterialIcons name="train" size={20} /> : <View style={stylesheet.circleIconWrapper} />}</View>
        {isWalk ? (
          <View style={[{ height }, stylesheet.dotContainer]}>
            {Array.from({ length: Math.ceil(height / 10) }).map((_, i) => (
              <View key={i} style={stylesheet.dot} />
            ))}
          </View>
        ) : (
          <View style={[stylesheet.solidRectangle, { height: adjustedHeight }]} />
        )}
        {!isWalk && <View style={stylesheet.circleIconWrapper} />}
      </View>
    </View>
  );
};

const formatIntoMinutesAndSeconds = (timingInSeconds: number) => {
  const seconds = (timingInSeconds % 60).toFixed(0);
  const minutes = Math.floor(timingInSeconds / 60).toFixed(0);
  if (minutes !== "0") {
    return `${minutes} minutes, ${seconds} seconds`;
  }
  return `${seconds} seconds`;
};

const PublicTransportLegPart: React.FC<PublicTransportLegProps> = ({ ptLeg, expanded, setExpanded }) => {
  return (
    <View style={stylesheet.legDetails}>
      <Pressable onPress={() => console.log("route pressed!")}>
        <Text style={{ fontFamily: "Inter-SemiBold" }}>{ptLeg.startingStopName}</Text>
        <View style={{ flexDirection: "row" }}>
          {ptLeg.type === "SUBWAY" && <SubwayTypeCard serviceType={ptLeg.serviceType} testID={""} />}
          {(ptLeg.type === "BUS" || ptLeg.type === "NUS_BUS") && <BusNumberCard busNumber={ptLeg.serviceType} busType={ptLeg.type} testID={""} />}
          {ptLeg.type === "NUS_BUS" && <Text>Wait for {formatIntoMinutesAndSeconds(ptLeg.startingStopETA)} for the next bus</Text>}
          {ptLeg.type === "WALK" && (
            <View>
              <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
            </View>
          )}
          {ptLeg.type === "TRAM" && (
            // <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
            <TramTypeCard serviceType={ptLeg.serviceType} testID={""} />
          )}
        </View>
        <View style={{ flexDirection: "column" }}>
          <View>
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={20} color="#434343" />
                <Text>
                  {" "}
                  Ride {ptLeg.intermediateStopCount} stops ({Math.ceil(ptLeg.duration / 60)} min)
                </Text>
              </View>
            </TouchableOpacity>
            {expanded && (
              <View>
                {ptLeg.intermediateStopNames.map((stop, index) => (
                  <Text key={index} style={{ lineHeight: 16 }}>
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
  );
};

const WalkLegPart: React.FC<WalkLegProps> = ({ walkLeg, legHeight }) => {
  //TO-DO: Add details on turns
  return (
    <View style={stylesheet.legDetails}>
      <Pressable onPress={() => console.log("Route pressed!")}>
        <Text style={{ marginTop: legHeight }}>
          Walk for {Math.round(walkLeg.distance)}m ({formatIntoMinutesAndSeconds(walkLeg.duration)})
        </Text>
      </Pressable>
    </View>
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
  if (baseResultsCardData.polylineArray == undefined && origin.latitude != destination.latitude && origin.longitude != destination.longitude) {
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
  const [expanded, setExpanded] = useState(false);

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
        testID="current-location-map"
      >
        <Marker
          title="Origin"
          coordinate={{
            latitude: origin.latitude,
            longitude: origin.longitude,
          }}
          testID="current-location-marker"
        />
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
                image={iconList.STOPCIRCULARMARKER}
              />
            );
          }
        })}
        <Marker
          title="Destination"
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
        />
        {polylineArray.length > 0 && <Polyline coordinates={formatted_array} strokeWidth={4} strokeColor="purple" zIndex={1} testID="current-location-polyline" />}
      </MapView>
      <ScrollView style={{ flex: 1, backgroundColor: "white" }} testID="ok">
        <View style={{ marginVertical: 15, marginHorizontal: 20 }}>
          <View style={{ flexDirection: "row" }}>
            <OriginRectangle />
            <View style={stylesheet.legDetails}>
              <Text style={{ fontFamily: "Inter-SemiBold" }}>Current Location</Text>
            </View>
          </View>
          {baseResultsCardData.journeyLegs.map((leg, index) => {
            // console.log("leg type", leg.type);
            // Calculate the height based on the content of each leg
            let legHeight = leg.type === "WALK" ? 20 : 40; // Adjust these values as needed
            return (
              <React.Fragment key={index}>
                <View style={{ flexDirection: "row" }}>
                  <LegRectangle height={legHeight} legType={leg.type} expanded={expanded} leg={leg} />
                  {(leg.type === "BUS" || leg.type === "SUBWAY" || leg.type === "NUS_BUS" || leg.type === "TRAM") && <PublicTransportLegPart ptLeg={leg as PublicTransportLeg} expanded={expanded} setExpanded={setExpanded} />}
                  {leg.type === "WALK" && <WalkLegPart walkLeg={leg as WalkLeg} legHeight={legHeight} />}
                </View>
              </React.Fragment>
            );
          })}
          <DestinationRectangle />
          <Text>Destination: {destination.address}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const stylesheet = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
    width: "100%",
  },
  MapView: {
    flex: 1,
    height: "30%",
    width: "100%",
  },
  ResultContainer: {
    flex: 1,
    flexDirection: "column",
  },
  LegContainer: {
    flex: 1,
    height: 150,
    flexDirection: "row",
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
    width: 18,
    height: 30, // Adjust as needed
    backgroundColor: "green",
  },
  dotContainer: {
    justifyContent: "space-around",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "grey",
    opacity: 0.5,
    marginVertical: 8,
  },
  circleIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
  },
  legDetails: {
    justifyContent: "flex-start",
    marginLeft: 10,
    marginTop: 7,
  },
});

export default DetailedRouteScreen;
