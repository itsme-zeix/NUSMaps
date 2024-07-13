import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
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
  useMutation,
} from "@tanstack/react-query";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import Toast from "react-native-toast-message";
import BusStopSearchBar from "@/components/BusStopSearchBar";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { getFavouritedBusStops } from "@/utils/storage";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import BusStopSearchScreen from "@/components/BusStopSearchScreen";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// STACK NAVIGATOR TO HANDLE BUS STOP SEARCHING
const Stack = createStackNavigator();
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack.Navigator initialRouteName="MainScreen">
        <Stack.Screen
          name="BusStopsScreen"
          component={BusStopsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BusStopSearchScreen"
          component={BusStopSearchScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </QueryClientProvider>
  );
}

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

// Logic to modify the timings in the BusService object from ISO time to minutes away from now.
const calculateMinutesDifference = (isoTime: string): string => {
  if (!isoTime) return "Loading"; // Handle uninitialized data

  // Calculate the difference in minutes between the current time and the given ISO time
  const now = new Date();
  const busTime = new Date(isoTime);

  if (isNaN(busTime.getTime())) {
    return "N/A"; // Handle invalid state
  }

  const differenceInMilliseconds = busTime.getTime() - now.getTime();
  const differenceInMinutes = Math.round(differenceInMilliseconds / 1000 / 60);
  return differenceInMinutes >= 0 ? `${differenceInMinutes} min` : "N/A"; // Correctly format the minute output
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

  useEffect(() => {
    animatedHeight.value = withTiming(expanded ? height : 0);
  }, [expanded, height]);

  const collapsibleStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

  return (
    <Animated.View style={[collapsibleStyle, { overflow: "hidden" }]}>
      <View style={{ position: "absolute" }} onLayout={onLayout}>
        <View
          style={{
            borderBottomColor: "#626262",
            borderBottomWidth: StyleSheet.hairlineWidth,
            marginHorizontal: 16,
          }}
        />
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

  // Function to determine the color based on bus stop name
  function getColor(busService: string) {
    switch (busService) {
      case "A1":
        return "#FF0000"; // Red
      case "A2":
        return "#E4CE0C"; // Yellow
      case "D1":
        return "#CD82E2"; // Purple
      case "D2":
        return "#6F1B6F"; // Dark Purple
      case "K":
        return "#345A9B"; // Blue
      case "E":
        return "#00B050"; // Green
      case "BTC":
        return "#EE8136"; // Orange
      case "L":
        return "#BFBFBF"; // Gray
      default:
        return "green"; // Default color for other bus stops
    }
  }

  return (
    <View style={styles.wrap}>
      <TouchableWithoutFeedback onPress={onItemPress}>
        <View style={styles.cardContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.busStopName}>
              {item.busStopName.startsWith("NUSSTOP")
                ? item.busStopName.slice(8)
                : item.busStopName}
            </Text>
            <Text style={styles.distanceAwayText}>
              {Number(item.distanceAway) < 1
                ? `~${(Number(item.distanceAway) * 1000).toFixed(0)}m away`
                : `~${Number(item.distanceAway).toFixed(2)}km away`}
            </Text>
          </View>
          <View style={styles.nusTagAndChevronContainer}>
            {item.busStopName.startsWith("NUSSTOP") && (
              <View style={styles.nusTag}>
                <Text style={styles.nusTagText}>NUS</Text>
              </View>
            )}
            <Image
              source={
                expanded
                  ? require("@/assets/images/chevron_up_blue_icon.png")
                  : require("@/assets/images/chevron_down_blue_icon.png")
              }
              style={styles.chevron}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>

      <CollapsibleContainer expanded={expanded}>
        <View style={styles.textContainer}>
          {item.savedBuses.map((bus: BusService, index: number) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                <ColouredCircle color={getColor(bus.busNumber)} size={15} />
                <Text style={[styles.details, styles.busNumber]}>
                  {bus.busNumber.startsWith("PUB:")
                    ? bus.busNumber.slice(4)
                    : bus.busNumber}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Text
                  style={[styles.details, styles.timingText]}
                  numberOfLines={1}
                >
                  {bus.timings[0]}
                </Text>
                <Text
                  style={[styles.details, styles.timingText]}
                  numberOfLines={1}
                >
                  {bus.timings[1]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CollapsibleContainer>
    </View>
  );
};

const useUserLocation = (refreshLocation: number) => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [locationReady, setLocationReady] = useState(false); // this is to only allow querying is getting user's current location is completed.

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

  useEffect(() => {
    getLocation();
  }, [refreshLocation]);

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

async function fetchBusArrivalTimes(busStops: any) {
  console.log("fetched bus stops: ", busStops);
  const response = await axios.post(
    "https://nusmaps.onrender.com/busArrivalTimes",
    busStops,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  if (response.status !== 200) {
    throw new Error("Network response was not ok");
  }
  return response.data;
}

function FavouriteBusStops({ refresh }: { refresh: () => void }) {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [dataMutated, setDataMutated] = useState(false);

  const { error, data: favouriteBusStops } = useQuery({
    queryKey: ["favouriteBusStops"],
    queryFn: getFavouritedBusStops,
    refetchOnWindowFocus: true,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: fetchBusArrivalTimes,
    onSuccess: (data) => {
      setBusStops(data); // update bus stops with fetched data
      setDataMutated(true); // set data mutated to true
    },
    onError: (error) => {
      console.error("Error fetching bus arrival times: ", error);
    },
  });

  useEffect(() => {
    if (
      favouriteBusStops &&
      Array.isArray(favouriteBusStops) &&
      favouriteBusStops.length > 0 &&
      !dataMutated
    ) {
      mutate(favouriteBusStops);
    }
  }, [favouriteBusStops, dataMutated, mutate]);

  // Ensure re-render by setting state properly & calculate minutes from ISOTime
  useEffect(() => {
    if (dataMutated) {
      setBusStops((prevBusStops) => {
        return prevBusStops.map((busStop) => {
          const updatedBuses = busStop.savedBuses.map((bus) => ({
            ...bus,
            timings: bus.timings.map((timing) =>
              calculateMinutesDifference(timing)
            ),
          }));
          return { ...busStop, savedBuses: updatedBuses };
        });
      });
    }
  }, [dataMutated]);

  const handleRefresh = () => {
    setDataMutated(false); // Reset dataMutated to allow re-fetching
    refresh(); // Trigger the refresh function passed as prop
  };

  if (favouriteBusStops && favouriteBusStops.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Inter-SemiBold", fontSize: 18, color: "#848484" }}> No bus stops have been favourited yet! </Text>
        <MaterialCommunityIcons name="ghost" size={80} color={"#848484"} style={{ marginTop: 10 }}/>
      </View>
    );
  }

  if (isPending)
    return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isPending} onRefresh={refresh} />
        }
      >
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isPending} onRefresh={handleRefresh} />
      }
    >
      <View>
        {busStops && Array.isArray(busStops) ? (
          busStops.map((busStop: BusStop, index: number) => (
            <ListItem key={index} item={busStop} />
          ))
        ) : (
          <Text>{JSON.stringify(busStops)}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Get nearest bus stops by location and render it. Backend API will return a busStops object with updated bus timings.
function NearbyBusStops({
  refreshLocation,
  refreshUserLocation,
}: {
  refreshLocation: number;
  refreshUserLocation: () => void;
}) {
  const location = useUserLocation(refreshLocation);

  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["busStopsByLocation"],
    staleTime: 30000, // 30 seconds
    queryFn: () =>
      fetch(
        `https://nusmaps.onrender.com/busStopsByLocation?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
      ).then((res) => res.json()),
  });

  if (isPending)
    return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isPending}
            onRefresh={refreshUserLocation}
          />
        }
      >
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  busStops.map((busStop: BusStop) =>
    busStop.savedBuses.map((bus: BusService) => {
      bus.timings[0] = calculateMinutesDifference(bus.timings[0]);
      bus.timings[1] = calculateMinutesDifference(bus.timings[1]);
    })
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isPending}
          onRefresh={refreshUserLocation}
        />
      }
    >
      <View>
        {busStops && Array.isArray(busStops) ? (
          busStops.map((busStop: BusStop, index: number) => (
            <ListItem key={index} item={busStop} />
          ))
        ) : (
          <Text>{JSON.stringify(busStops)}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Get all NUS Bus Stops and its associated timings and render it.
function NUSBusStops({ refresh }: { refresh: () => void }) {
  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["nusBusStops"],
    staleTime: 30000, // 30 seconds
    queryFn: () =>
      fetch(`https://nusmaps.onrender.com/nusBusStops`).then((res) =>
        res.json()
      ),
  });

  if (isPending)
    return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isPending} onRefresh={refresh} />
        }
      >
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  if (busStops && Array.isArray(busStops)) {
    busStops.forEach((busStop: BusStop) =>
      busStop.savedBuses.forEach((bus: BusService) => {
        bus.timings[0] = calculateMinutesDifference(bus.timings[0]);
        bus.timings[1] = calculateMinutesDifference(bus.timings[1]);
      })
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isPending} onRefresh={refresh} />
      }
    >
      <View>
        {busStops && Array.isArray(busStops) ? (
          busStops.map((busStop: BusStop, index: number) => (
            <ListItem key={index} item={busStop} />
          ))
        ) : (
          <Text>{JSON.stringify(busStops)}</Text>
        )}
      </View>
    </ScrollView>
  );
}

function BusStopsScreen() {
  const [refreshLocation, setRefreshLocation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0); // State to handle the logic of rendering nearby(0) or NUS(1) bus stops.

  const refetchFavouriteBusStops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["favouriteBusStops"] });
  }, [queryClient]);

  const refetchNUSBusStops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["nusBusStops"] });
  }, [queryClient]);

  const refetchUserLocation = useCallback(() => {
    setRefreshLocation((prevKey) => prevKey + 1);
    queryClient.invalidateQueries({ queryKey: ["busStopsByLocation"] });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ backgroundColor: "white", flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <BusStopSearchBar />
          <View style={styles.segmentedControlContainer}>
            <SegmentedControl
              values={["Favourites", "Nearby", "NUS"]}
              selectedIndex={selectedIndex}
              onChange={(event) => {
                setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
              }}
              appearance={"light"}
              style={{
                height: 45,
                width: "93%",
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            {selectedIndex === 0 ? (
              <FavouriteBusStops refresh={refetchFavouriteBusStops} />
            ) : selectedIndex === 1 ? (
              <NearbyBusStops
                refreshLocation={refreshLocation}
                refreshUserLocation={refetchUserLocation}
              />
            ) : (
              <NUSBusStops refresh={refetchNUSBusStops} />
            )}
          </View>
        </SafeAreaView>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderColor: "#ccc",
    borderWidth: 0.5,
    marginVertical: 5,
    marginHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  image: { width: 50, height: 50, margin: 10, borderRadius: 5 },
  textContainer: {
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  busStopName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    paddingLeft: 14,
    paddingBottom: 5,
  },
  distanceAwayText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#626262",
    paddingLeft: 14,
  },
  busNumber: {
    fontSize: 13,
    fontFamily: "Inter-SemiBold",
  },
  timingText: {
    fontSize: 13,
    fontFamily: "Inter-Medium",
    width: 50,
  },
  details: {
    margin: 10,
    textAlign: "right",
  },
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
    justifyContent: "center",
  },
  nusTagAndChevronContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingRight: 16,
    marginVertical: 20,
  },
  nusTag: {
    backgroundColor: "#27187E",
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  nusTagText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    color: "#EBF3FE",
  },
  chevron: {
    width: 30,
    height: 30,
  },
  segmentedControlContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
});
