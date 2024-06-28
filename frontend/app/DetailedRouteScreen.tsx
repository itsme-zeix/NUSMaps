import React from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Image,
  Pressable,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline,
  LatLng,
} from "react-native-maps";
import { SubwayTypeCard } from "@/app/(tabs)/SubwayType";
import { BusNumberCard } from "@/app/(tabs)/BusNumber";
import { useLocalSearchParams } from "expo-router";

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
}

interface WalkLeg extends LegBase {
  walkInfo: {
    distance: number;
    direction: string;
  }[];
}

type destinationType = {
  address: string;
  placeId: string;
} & LatLng;

interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  totalTimeTaken: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
}
type Leg = PublicTransportLeg | WalkLeg;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: number[];
}

interface IconCatalog {
  WALK: ImageSourcePropType;
  SUBWAY: ImageSourcePropType;
  BUS: ImageSourcePropType;
  TRAM: ImageSourcePropType;
  RCHEVRON: ImageSourcePropType;
  MARKER: ImageSourcePropType;
  FLAG: ImageSourcePropType;
}

const iconList: IconCatalog = {
  WALK: require("../assets/images/walk_icon.png"),
  SUBWAY: require("../assets/images/subway_icon.png"),
  BUS: require("../assets/images/bus_icon.png"),
  TRAM: require("../assets/images/tram_icon.png"),
  RCHEVRON: require(`../assets/images/chevron_right_icon.png`),
  MARKER: require("../assets/images/location-icon.png"),
  FLAG: require("../assets/images/finishFlag-icon.png"),
};

interface PublicTransportLegProps {
  ptLeg: PublicTransportLeg;
}

interface WalkLegProps {
  walkLeg: WalkLeg;
}

const OriginRectangle: React.FC = () => {
  return (
    <View style={stylesheet.barContainer}>
      <Image
        source={iconList["MARKER"]}
        style={{ width: 20, height: 20 }}
      ></Image>
      <View style={stylesheet.rectangle}></View>
    </View>
  );
};

const DestinationFlag: React.FC = () => {
  return (
    <View style={stylesheet.barContainer}>
      <View style={stylesheet.circle}>
        <Image
          source={iconList["FLAG"]}
          style={{ width: 20, height: 20 }}
        ></Image>
      </View>
    </View>
  );
};

const LegRectangle: React.FC = () => {
  return (
    <View style={stylesheet.barContainer}>
      <View style={stylesheet.circle} />
      <View style={stylesheet.rectangle} />
    </View>
  );
};

const PublicTransportLegPart: React.FC<PublicTransportLegProps> = ({
  ptLeg,
}) => {
  //TO-DO: put in Tram type
  console.log("type:", ptLeg.type);
  console.log(ptLeg.intermediateStopCount);
  return (
    <View>
      <Pressable onPress={() => console.log("route pressed!")}>
        <Text>{ptLeg.startingStopName}</Text>
        <View style={{ flexDirection: "row" }}>
          {ptLeg.type === "SUBWAY" && (
            <SubwayTypeCard serviceType={ptLeg.serviceType} />
          )}
          {ptLeg.type === "BUS" && (
            <BusNumberCard busNumber={ptLeg.serviceType} />
          )}
          {ptLeg.type === "WALK" && (
            <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
          )}
          {ptLeg.type === "TRAM" && (
            <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text>
            {" "}
            Ride {ptLeg.intermediateStopCount} stops (
            {ptLeg.intermediateStopCount} min)
          </Text>
          <Image source={iconList["RCHEVRON"]}></Image>
        </View>
        <View>
          {ptLeg.intermediateStopNames.map((stop, index) => {
            return <Text key={index}>{stop}</Text>;
          })}
          <Text> {ptLeg.destinationStopName}</Text>
        </View>
      </Pressable>
    </View>
  );
};

const WalkLegPart: React.FC<WalkLegProps> = ({ walkLeg }) => {
  //TO-DO: Add details on turns
  const totalDistance = walkLeg.walkInfo.reduce(
    (sum, curr) => sum + curr.distance,
    0
  );
  return (
    <View style={{ backgroundColor: "green" }}>
      <Pressable onPress={() => console.log("Route pressed!")}>
        <Text>Walk for {totalDistance}m </Text>
      </Pressable>
    </View>
  );
};

const DetailedRoutingScreen: React.FC<
  baseResultsCardType & destinationType & LatLng
> = () => {
  //add a base current location and end flag
  console.log("gone here");
  const params = useLocalSearchParams();
  let destination: destinationType = JSON.parse(
    params.destinationType as string
  );
  console.log("dest:", destination);
  let origin: LatLng = JSON.parse(params.origin as string);
  console.log("origin:", origin);
  if (params.baseResultsCardData == undefined) {
    console.error("no base results received");
    return;
  }
  const baseResultsCardData: baseResultsCardType = JSON.parse(
    params.baseResultsCardData as string
  );
  let polylineArray: number[] = [];
  if (
    baseResultsCardData.polylineArray == undefined &&
    origin.latitude != destination.latitude &&
    origin.longitude != destination.longitude
  ) {
    console.error(
      "no routing received despite differing origins and destination"
    );
  } else {
    polylineArray = baseResultsCardData.polylineArray;
  }
  console.log("polyline: ", polylineArray);
  const formatted_array: LatLng[] = [];
  for (let step = 0; step < polylineArray.length; step += 2) {
    formatted_array.push({
      latitude: polylineArray[step],
      longitude: polylineArray[step + 1],
    });
  }
  return (
    <SafeAreaView style={stylesheet.SafeAreaView}>
      <MapView
        style={stylesheet.MapView}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 2,
          longitudeDelta:
            Math.abs(origin.longitude - destination.longitude) * 2,
        }}
      >
        <Marker coordinate={origin} />
        <Marker coordinate={destination} />
        {polylineArray.length > 0 && (
          <Polyline
            coordinates={formatted_array}
            strokeWidth={4}
            strokeColor="purple"
            zIndex={1}
          />
        )}
      </MapView>
      <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
        <View style={{ flexDirection: "row" }}>
          <OriginRectangle />
          <Text style={{ backgroundColor: "red" }}>
            Starting position: {origin.latitude}, {origin.longitude}
          </Text>
        </View>
        {baseResultsCardData.journeyLegs.map((leg, index) => {
          console.log("leg type", leg.type);
          return (
            <React.Fragment key={index}>
              <View style={{ flexDirection: "row" }}>
                <LegRectangle />
                {(leg.type === "BUS" || leg.type === "SUBWAY") && (
                  <PublicTransportLegPart ptLeg={leg as PublicTransportLeg} />
                )}
                {leg.type === "WALK" && (
                  <WalkLegPart walkLeg={leg as WalkLeg} />
                )}
              </View>
            </React.Fragment>
          );
        })}
        <DestinationFlag />
        <Text>Destination: {destination.address}</Text>
      </ScrollView>
    </SafeAreaView>
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
  rectangle: {
    width: 4,
    height: 30, // Adjust as needed
    backgroundColor: "limegreen",
    marginLeft: 8,
  },
});

export default DetailedRoutingScreen;
