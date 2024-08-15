import { LatLng } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

export type destinationType = {
  address: string;
  placeId: string;
} & LatLng;

interface LegBase {
  //base template for the info that is displayed in the leg
  type: string;
  startTime: number; //start and end time only defined for buses(+ nus buses) for now
  endTime: number;
  duration: number;
}

export interface WalkLeg extends LegBase {
  walkInfo: {
    distance: number;
    direction: string;
  }[];
  distance: number;
}

export interface PublicTransportLeg extends LegBase {
  //used to display the routes info
  startingStopETA: number;
  serviceType: string;
  startingStopName: string;
  destinationStopName: string;
  intermediateStopCount: number;
  intermediateStopNames: string[];
  intermediateStopGPSLatLng: LatLng[];
}

export type Leg = PublicTransportLeg | WalkLeg;

export interface baseResultsCardType {
  types: string[];
  journeyTiming: string;
  wholeJourneyTiming: string;
  journeyLegs: Leg[]; //an array of all the legs in 1 route
  polylineArray: string[]; //each leg's polyline is a string
  stopsCoordsArray: string[];
}

export interface SingleResultCardData {
  origin: LatLng;
  destination: destinationType;
  resultData: baseResultsCardType;
}

export interface RouteSearchBarInput {
  location: Location.LocationObjectCoords;
}
export interface busStopType extends LatLng {
  name: string;
}

export interface activeBusType extends LatLng {
  direction: number;
  crowdLevel: string;
  licensePlate: string;
}

export interface BusService {
  busNumber: string;
  timings: string[]; // ISO format
}

export interface BusStop {
  busStopName: string;
  busStopId: string;
  distanceAway: string | null;
  savedBuses: BusService[];
  latitude: number;
  longitude: number;
  isFavourited: boolean;
}
