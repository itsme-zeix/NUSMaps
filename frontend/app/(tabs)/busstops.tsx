import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  ScrollView,
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
import { LocationObject } from "expo-location";
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

// UI COMPONENTS
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

const ListItem = ({ item }: { item: BusStop }) => {
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
            <Text style={styles.text}>
              {Number(item.distanceAway) < 1
                ? `~${(Number(item.distanceAway) * 1000).toFixed(0)}m away`
                : `~${Number(item.distanceAway).toFixed(2)}km away`}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <CollapsibleContainer expanded={expanded}>
        <View style={styles.textContainer}>
          {item.savedBuses.map((bus: BusService, index: number) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                {/* TODO: use conditional to assign colour to circle based on busStopName/tag */}
                {/* Can consider moving this logic into the BusStop interface */}
                <ColouredCircle color="blue" size={15} />
                <Text style={[styles.details, styles.text]}>
                  {bus.busNumber}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Text style={[styles.details, styles.text]}>
                  {bus.timings[1] !== "N/A"
                    ? `${bus.timings[0]} min`
                    : bus.timings[0]}
                </Text>
                <Text style={[styles.details, styles.text]}>
                  {bus.timings[1] !== "N/A"
                    ? `${bus.timings[1]} min`
                    : bus.timings[1]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CollapsibleContainer>
    </View>
  );
};

const useUserLocation = () => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [locationReady, setLocationReady] = useState(false); // this is to only allow querying is getting user's current location is completed.

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionErrorMsg("Permission to access location was denied.");
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setLocationReady(true);
      } catch (error) {
        setLocationErrorMsg(`Failed to obtain location, ${error}`);
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    if (permissionErrorMsg) {
      Toast.show({
        type: "error",
        text1: permissionErrorMsg,
        text2: "Please enable location permissions for NUSMaps.",
        position: "top",
        autoHide: true,
      });
    }
  }, [permissionErrorMsg]);

  useEffect(() => {
    if (locationErrorMsg) {
      Toast.show({
        type: "error",
        text1: locationErrorMsg,
        text2: "Please try again later",
        position: "top",
        autoHide: true,
      });
    }
  }, [locationErrorMsg]);

  return locationReady ? location : null;
};

// PERFORM API QUERY
const queryClient = new QueryClient();
// Get nearest bus stops by location and render it. Backend API will return a busStops object with updated bus timings.
function BusStops() {
  const location = useUserLocation();
  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["busStopsByLocation"],
    queryFn: () =>
      fetch(
        `http://localhost:3000/busStopsByLocation?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
      ).then((res) => res.json()),
  });

  if (isPending) return <Text>Loading...</Text>;
  if (error) return <Text>An error has occurred: {error.message}</Text>;

  // Logic to modify the timings in the BusService object from ISO time to minutes away from now.
  const calculateMinutesDifference = (isoTime: string): string => {
    // Calculate the difference in minutes between the current time and the given ISO time
    const now = new Date();
    const busTime = new Date(isoTime);

    if (isNaN(busTime.getTime())) {
      // If busTime is invalid, return a default value or handle the error
      return "N/A";
    }

    const differenceInMilliseconds = busTime.getTime() - now.getTime();
    const differenceInMinutes = Math.round(
      differenceInMilliseconds / 1000 / 60
    );
    return String(differenceInMinutes >= 0 ? differenceInMinutes : 0);
  };

  busStops.map((busStop: BusStop) =>
    busStop.savedBuses.map((bus: BusService) => {
      bus.timings[0] = calculateMinutesDifference(bus.timings[0]);
      bus.timings[1] = calculateMinutesDifference(bus.timings[1]);
    })
  );

  return (
    <ScrollView>
      <>
        {busStops && Array.isArray(busStops) ? (
          busStops.map((busStop: BusStop, index: number) => (
            <ListItem key={index} item={busStop} />
          ))
        ) : (
          <Text>{JSON.stringify(busStops)}</Text>
        )}
      </>
    </ScrollView>
  );
}

export default function BusStopsScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView>
        <BusStopSearchBar />
        <BusStops />
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
