import React from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  Image,
  Pressable,
  ImageURISource,
} from "react-native";
import { ImageSourcePropType } from "react-native";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Polyline,
  LatLng,
  Callout
} from "react-native-maps";
import { SubwayTypeCard } from "@/app/(tabs)/SubwayType";
import { BusNumberCard } from "@/app/(tabs)/BusNumber";
import { TramTypeCard } from "./(tabs)/TramNumber";
import { useLocalSearchParams } from "expo-router";

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
  startTime: number, //start and end time only defined for buses(+ nus buses) for now
  endTime: number,
  duration:number,
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
  startingStopETA: number, //only defined for nus buses, for now
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  duration: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
};

type Leg = PublicTransportLeg | WalkLeg;

type stopCoords = {
  name:string
} & LatLng;

interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: string[]; //each leg's polyline is a string
  stopsCoordsArray: string[]
};

interface IconCatalog {
  WALK: ImageSourcePropType;
  SUBWAY: ImageSourcePropType;
  BUS: ImageSourcePropType;
  TRAM: ImageSourcePropType;
  RCHEVRON: ImageSourcePropType;
  MARKER: ImageSourcePropType;
  FLAG: ImageSourcePropType;
  STOPCIRCULARMARKER: ImageURISource;
}

const iconList: IconCatalog = {
  WALK: require("../assets/images/walk-icon.png"),
  SUBWAY: require("../assets/images/subway-icon.png"),
  BUS: require("../assets/images/bus-icon.png"),
  TRAM: require("../assets/images/tram-icon.png"),
  RCHEVRON: require(`../assets/images/chevron_right-icon.png`),
  MARKER: require("../assets/images/location-icon.png"),
  FLAG: require("../assets/images/finishFlag-icon.png"),
  STOPCIRCULARMARKER: require("../assets/images/mapCircle-icon.png")
};

interface PublicTransportLegProps {
  ptLeg: PublicTransportLeg;
}

interface WalkLegProps {
  walkLeg: WalkLeg;
}

const polyline = require("@mapbox/polyline");
const { format } = require('date-fns');

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
const formatIntoMinutesAndSeconds = (timingInSeconds:number) => {
  const seconds = timingInSeconds % 60;
  const minutes  = Math.floor(timingInSeconds / 60);
  if (minutes !== 0) {
    return `${minutes} minutes, ${seconds} seconds`;
  };
  return `${seconds} seconds`;
};

const PublicTransportLegPart: React.FC<PublicTransportLegProps> = ({
  ptLeg,
}) => {
  //TO-DO: put in Tram type
  console.log("type:", ptLeg.type);
  console.log("duration:", ptLeg.duration);
  return (
    <View>
      <Pressable onPress={() => console.log("route pressed!")}>
        <Text>{ptLeg.startingStopName}</Text>
        <View style={{ flexDirection: "row" }}>
          {ptLeg.type === "SUBWAY" && (
            <SubwayTypeCard serviceType={ptLeg.serviceType} />
          )}
          {(ptLeg.type === "BUS" || ptLeg.type === "NUS_BUS")  && (
              <BusNumberCard busNumber={ptLeg.serviceType} busType={ptLeg.type} />
          )} 
          {ptLeg.type === "NUS_BUS" && (
            <Text>Wait for {formatIntoMinutesAndSeconds(ptLeg.startingStopETA)} for the next bus</Text>
          )} 
          {ptLeg.type === "WALK" && (
            <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
          )}
          {ptLeg.type === "TRAM" && (
            // <Image source={iconList[ptLeg.type as keyof IconCatalog]} />
            <TramTypeCard serviceType={ptLeg.serviceType} />
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text>
            {" "}
            Ride {ptLeg.intermediateStopCount} stops (
            {Math.ceil(ptLeg.duration / 60)} min)
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
        <Text>Walk for {totalDistance}m ({formatIntoMinutesAndSeconds(walkLeg.duration)})</Text>
      </Pressable>
    </View>
  );
};

const DetailedRoutingScreen: React.FC<
  baseResultsCardType & destinationType & LatLng
> = () => {
  //add a base current location and end flag
  const params = useLocalSearchParams();
  console.log("destination type:", params.destination);
  let destination: destinationType = JSON.parse(
    params.destination as string
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
  let polylineArray: string[] = [];
  if (
    baseResultsCardData.polylineArray == undefined &&
    origin.latitude != destination.latitude && 
    origin.longitude != destination.longitude
  ) {
    console.log("base results card data: ", JSON.stringify(baseResultsCardData));
    // console.log("stop coords array as str: ", JSON.stringify(baseResultsCardData).)
    console.error(
      "no routing received despite differing origins and destination"
    );
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
  for (let arr of (polyline.decode(polylineArray))) {
    formatted_array.push({
      latitude: arr[0],
      longitude:arr[1]
    });
  };
  const stopsCoordsArray:stopCoords[] = baseResultsCardData.stopsCoordsArray.map((str) => {return JSON.parse(str);});
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
        <Marker title="Origin" coordinate={{latitude: origin.latitude, longitude: origin.longitude}}/>
        {stopsCoordsArray.map((stop, index) => {
          if (stop.name != "Origin" && stop.name != "Destination" ) {
          return (<Marker title={stop.name} index = {index} coordinate={{latitude: stop.latitude, longitude: stop.longitude}} image={iconList.STOPCIRCULARMARKER}/>);
        }})}
        <Marker title="Destination" coordinate={{latitude: destination.latitude, longitude: destination.longitude}}/>
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
                {(leg.type === "BUS" || leg.type === "SUBWAY" || leg.type === "NUS_BUS" || leg.type === "TRAM") && (
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
