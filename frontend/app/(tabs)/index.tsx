import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

// Self-built components
import { getFavouritedBusStops } from "@/utils/storage";
import BusStopSearchBar from "@/components/busStopsTab/BusStopSearchBar";
import BusStopSearchScreen from "@/components/busStopsTab/BusStopSearchScreen";
import ColouredCircle from "@/components/ColouredCircle";
import CollapsibleContainer from "@/components/busStopsTab/CollapsibleContainer";
import useUserLocation from "@/hooks/useUserLocation";
import { NUSTag } from "@/components/busStopsTab/NUSTag";
import mapBusServiceColour from "@/utils/mapBusServiceColor";

// Stack navigator to redirect from bus stop screen to bus stop search screen (vice-versa)
const Stack = createStackNavigator();
export default function BusStopSearchNavigator(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack.Navigator initialRouteName="MainScreen">
        <Stack.Screen name="BusStopsScreen" component={BusStopsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BusStopSearchScreen" component={BusStopSearchScreen} options={{ headerShown: false }} />
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
  latitude: number;
  longitude: number;
  isFavourited: boolean;
}

// Logic to modify the timings in a BusService object from ISO time to minutes away from now.
const calculateMinutesDifference = (isoTime: string): string => {
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

// This returns a React component of each bus stop that is expandable.
export const ExpandableBusStop = ({ item }: { item: BusStop }) => {
  //Used to render details for 1 bus stop
  const [expanded, setExpanded] = useState(false);

  const onItemPress = () => {
    setExpanded(!expanded);
  }

  return (
    <View style={styles.wrap}>
      <TouchableWithoutFeedback onPress={onItemPress}>
        <View style={styles.cardContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.busStopName}>{item.busStopName.startsWith("NUSSTOP") ? item.busStopName.slice(8) : item.busStopName}</Text>
            <Text style={styles.distanceAwayText}>{Number(item.distanceAway) < 1 ? `~${(Number(item.distanceAway) * 1000).toFixed(0)}m away` : `~${Number(item.distanceAway).toFixed(2)}km away`}</Text>
          </View>
          <View style={styles.nusTagAndChevronContainer}>
            {item.busStopName.startsWith("NUSSTOP") && <NUSTag />}
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={25} color="#0163CF" />
          </View>
        </View>
      </TouchableWithoutFeedback>

      <CollapsibleContainer expanded={expanded}>
        <View style={styles.textContainer}>
          {item.savedBuses.map((bus: BusService, index: number) => (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                <ColouredCircle color={mapBusServiceColour(bus.busNumber)} size={15} />
                <Text style={[styles.details, styles.busNumber]}>{bus.busNumber.startsWith("PUB:") ? bus.busNumber.slice(4) : bus.busNumber}</Text>
              </View>
              <View style={styles.rightContainer}>
                <Text style={[styles.details, styles.timingText]} numberOfLines={1}>
                  {calculateMinutesDifference(bus.timings[0])}
                </Text>
                <Text style={[styles.details, styles.timingText]} numberOfLines={1}>
                  {calculateMinutesDifference(bus.timings[1])}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CollapsibleContainer>
    </View>
  );
};

// React Query client
const queryClient = new QueryClient();

// This function is used to obtain bus stop timings (POST request to REST API) for bus stops that are favourited.
async function fetchBusArrivalTimes(busStopsWithLocation: any) {
  const response = await axios.post("https://nusmaps.onrender.com/busArrivalTimes", busStopsWithLocation, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) {
    throw new Error("Network response was not ok");
  }
  return response.data;
}

// Get favourite bus stops, retrieves timing from REST API (using fetchBusArrivalTimes function) and renders list of ExpandableBusStop
function FavouriteBusStops({ refreshLocation, refresh }: { refreshLocation: number; refresh: () => void }) {
  const location = useUserLocation(refreshLocation);
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [dataMutated, setDataMutated] = useState(false);

  const {
    error,
    data: favouriteBusStops,
    refetch,
  } = useQuery({
    queryKey: ["favouriteBusStops"],
    queryFn: getFavouritedBusStops,
    refetchOnWindowFocus: "always",
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
    if (favouriteBusStops && Array.isArray(favouriteBusStops) && favouriteBusStops.length > 0 && !dataMutated && location) {
      const dataWithLocation = {
        latitude: location!.coords.latitude,
        longitude: location!.coords.longitude,
        favouriteBusStops,
      };
      mutate(dataWithLocation);
    }
  }, [favouriteBusStops, dataMutated, mutate, location]);

  const handleRefresh = () => {
    setDataMutated(false); // Reset dataMutated to allow re-fetching
    refresh(); // Trigger the refresh function passed as prop
    refetch(); // Refetch the favourite bus stops data
  };

  if (isPending) return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={refresh} />}>
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={handleRefresh} />} contentContainerStyle={{ flexGrow: 1 }}>
      {favouriteBusStops && favouriteBusStops.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 18,
              color: "#848484",
            }}
          >
            No bus stops have been favourited yet!
          </Text>
          <MaterialCommunityIcons name="ghost" size={80} color={"#848484"} style={{ marginTop: 10 }} />
        </View>
      ) : (
        <View>{busStops && Array.isArray(busStops) ? busStops.map((busStop: BusStop, index: number) => <ExpandableBusStop key={index} item={busStop} />) : <Text>{JSON.stringify(busStops)}</Text>}</View>
      )}
    </ScrollView>
  );
}

// Get nearest bus stops based on location, retrieves timing from REST API endpoint(GET) and renders list of ExpandableBusStop.
function NearbyBusStops({ refreshLocation, refreshUserLocation }: { refreshLocation: number; refreshUserLocation: () => void }) {
  const location = useUserLocation(refreshLocation);

  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["busStopsByLocation"],
    staleTime: 30000, // 30 seconds
    queryFn: () =>
      axios.get(`https://nusmaps.onrender.com/busStopsByLocation?latitude=${location!.coords.latitude}&longitude=${location!.coords.longitude}`).then((res) => {
        return res.data;
      }),
  });

  if (isPending) return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={refreshUserLocation} />}>
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={refreshUserLocation} />}>
      <View>{busStops && Array.isArray(busStops) ? busStops.map((busStop: BusStop, index: number) => <ExpandableBusStop key={index} item={busStop} />) : <Text>{JSON.stringify(busStops)}</Text>}</View>
    </ScrollView>
  );
}

// Get NUS Bus Stops, retrieves timing from REST API endpoint(GET) and renders list of ExpandableBusStop.
function NUSBusStops({ refreshLocation, refresh }: { refreshLocation: number; refresh: () => void }) {
  const location = useUserLocation(refreshLocation);

  const {
    isPending,
    error,
    data: busStops,
  } = useQuery({
    queryKey: ["nusBusStops"],
    staleTime: 30000, // 30 seconds
    queryFn: () => axios.get(`https://nusmaps.onrender.com/nusBusStops?latitude=${location!.coords.latitude}&longitude=${location!.coords.longitude}`).then((res) => res.data),
  });

  if (isPending) return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={refresh} />}>
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={refresh} />}>
      <View>{busStops && Array.isArray(busStops) ? busStops.map((busStop: BusStop, index: number) => <ExpandableBusStop key={index} item={busStop} />) : <Text>{JSON.stringify(busStops)}</Text>}</View>
    </ScrollView>
  );
}

function BusStopsScreen() {
  const [refreshLocation, setRefreshLocation] = useState(0); // State to handle the re-retrieval of user location.
  const [selectedIndex, setSelectedIndex] = useState(0); // State to handle the logic of rendering Favourites, Nearby or NUS bus stops.

  const refetchFavouriteBusStops = useCallback(() => {
    setRefreshLocation((prevKey) => prevKey + 1);
    queryClient.invalidateQueries({ queryKey: ["favouriteBusStops"] });
  }, [queryClient]);

  const refetchNUSBusStops = useCallback(() => {
    setRefreshLocation((prevKey) => prevKey + 1);
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
          <View style={{ flex: 1 }}>{selectedIndex === 0 ? <FavouriteBusStops refreshLocation={refreshLocation} refresh={refetchFavouriteBusStops} /> : selectedIndex === 1 ? <NearbyBusStops refreshLocation={refreshLocation} refreshUserLocation={refetchUserLocation} /> : <NUSBusStops refreshLocation={refreshLocation} refresh={refetchNUSBusStops} />}</View>
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
    alignItems: "center",
    paddingRight: 16,
    marginVertical: 20,
  },
  segmentedControlContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
});
