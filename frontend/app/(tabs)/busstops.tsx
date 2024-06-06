import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import BusStopSearchBar from "@/components/BusStopSearchBar";

// INTERFACES
interface BusService {
  busNumber: string;
  timings: string[]; // ISO format
}
interface BusStop {
  busStopName: string;
  busStopId: string;
  distanceAway: string;
  savedBuses: BusService[];
}
interface Coords {
  latitude: number | null;
  longitude: number | null;
}

// EXAMPLES
const changiAirport: BusStop = {
  busStopName: "Changi Airport",
  distanceAway: "~200m away",
  savedBuses = [],
};

const tanahMerahMRT: BusStop = {
  busStopName: "Tanah Merah MRT",
  distanceAway: "~500m away",
  details: [
    ["name", "time1", "time2"],
    ["name", "time1", "time2"],
  ],
};

const busStops: BusStop[] = [changiAirport, tanahMerahMRT];

// UI COMPONENTS
const CollapsibleContainer = ({
  children,
  expanded,
}: {
  children: React.ReactNode;
  expanded: boolean;
}) => {
  const [height, setHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const onLayoutHeight = event.nativeEvent.layout.height;

    if (onLayoutHeight > 0 && height !== onLayoutHeight) {
      setHeight(onLayoutHeight);
    }
  };

  const collapsibleStyle = useAnimatedStyle(() => {
    animatedHeight.value = withTiming(expanded ? height : 0);

    return {
      height: animatedHeight.value,
    };
  }, [expanded]);

  return (
    <Animated.View style={[collapsibleStyle, { overflow: "hidden" }]}>
      <View style={{ position: "absolute" }} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
};

const ColouredCircle = ({
  color,
  size = 50,
}: {
  color: string;
  size?: number;
}) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
};

const ListItem = ({ item }: { item: any }) => {
  //Used to render details for 1 bus stop
  const [expanded, setExpanded] = useState(false);

  const onItemPress = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.wrap}>
      <TouchableWithoutFeedback onPress={onItemPress}>
        <View style={styles.container}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{item.busStopName}</Text>
            <Text style={styles.text}>{item.distanceAway}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <CollapsibleContainer expanded={expanded}>
        <View style={styles.textContainer}>
          {item.details.map((detail: string[], index: number) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                {/* TODO: use conditional to assign colour to circle based on busStopName/tag */}
                {/* Can consider moving this logic into the BusStop interface */}
                <ColouredCircle color="blue" size={15} />
                <Text style={[styles.details, styles.text]}>{detail[0]}</Text>
              </View>
              <View style={styles.rightContainer}>
                <Text style={[styles.details, styles.text]}>{detail[1]}</Text>
                <Text style={[styles.details, styles.text]}>{detail[2]}</Text>
              </View>
            </View>
          ))}
        </View>
      </CollapsibleContainer>
    </View>
  );
};

// OBTAIN USER LOCATION
const userLocation: Coords = {
  latitude: null,
  longitude: null,
};

function updateUserLocation() {
  // Hooks
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");

  // Toast to display error from denial of gps permission
  useEffect(() => {
    if (permissionErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please enable location permissions for NUSMaps.",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

  //Toast to display error from inability to fetch location even with gps permission
  useEffect(() => {
    if (locationErrorMsg != "") {
      Toast.show({
        type: "error",
        text1: locationErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [locationErrorMsg]);

  // try to obtain gps location
  async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      setPermissionErrorMsg("Permission to access location was denied.");
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      // process location
    } catch (error) {
      setLocationErrorMsg(`Failed to obtain location, ${error}`);
      console.error("Failed to obtain location.", error);
    }
  };
}

// PERFORM API QUERY
const queryClient = new QueryClient();
// Get nearest bus stops by location. Backend API will return an busStops object with updated bus timings.
function queryBusStops() {
  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["busStopsByLocation", userLocation],
    queryFn: () =>
      fetch("https://nusmaps.onrender.com/busStopsByLocation").then((res) =>
        res.json()
      ),
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return busStops.map((busStop: BusStop, index: number) => (
    <ListItem key={index} item={busStop} />
  ));
}

export default function BusStopsScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView>
        <BusStopSearchBar></BusStopSearchBar>
        {busStops.map((busStop, index) => (
          <ListItem key={index} item={busStop} />
        ))}
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderColor: "#ccc",
    borderWidth: 1,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  container: { flexDirection: "row" },
  image: { width: 50, height: 50, margin: 10, borderRadius: 5 },
  textContainer: {
    justifyContent: "space-between",
  },
  details: { margin: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  text: { opacity: 0.7 },
});
