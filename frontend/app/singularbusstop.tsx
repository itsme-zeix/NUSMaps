import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BusStop, BusService } from "@/types";
import { NUSTag } from "@/components/busStopsTab/NUSTag";
import { Ionicons } from "@expo/vector-icons";
import ColouredCircle from "@/components/ColouredCircle";
import mapBusServiceColour from "@/utils/mapBusServiceColor";
import axios from "axios";
import useUserLocation from "@/hooks/useUserLocation";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { mapNUSCodeNametoFullName } from "@/utils/mapNUSCodeNametoFullName";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { router, useLocalSearchParams } from "expo-router";

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

  // Display Arr if less than 1 minute till arrival
  if (differenceInMilliseconds <= 60000) {
    return "Arr.";
  }

  return differenceInMinutes > 0 ? `${differenceInMinutes} min` : "N/A"; // Correctly format the minute output
};

// This returns a React component of a bus stop and its timings. The card is originally collapsible (as used in bus stops tab), but is forced to be expanded now.
const BusStopCard = ({ item }: { item: BusStop }) => {
  //Used to render details for 1 bus stop
  const updatedBusStopName = mapNUSCodeNametoFullName(item.busStopName);
  const [updateAsyncStorageErrorMsg, setUpdateAsyncStorageErrorMsg] = useState("");
  const [data, setData] = useState<BusStop[]>([]);
  const [favouriteState, setFavouriteState] = useState(item.isFavourited);

  const toggleFavourite = async (busStopId: string) => {
    try {
      // Fetch the current data from AsyncStorage
      const storedData = await AsyncStorage.getItem("busStops");
      let parsedData = storedData ? JSON.parse(storedData) : [];

      // Update the favourite state for the specific bus stop
      const updatedData = parsedData.map((item: BusStop) =>
        item.busStopId === busStopId ? { ...item, isFavourited: !item.isFavourited } : item
      );

      // Set the updated state in both the local state and AsyncStorage
      setFavouriteState((prevState) => !prevState); // Toggle favourite state locally
      setData(updatedData); // Update the data state with the new favourite state

      // Store the updated data back to AsyncStorage
      await AsyncStorage.setItem("busStops", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
      setUpdateAsyncStorageErrorMsg(`Failed to update AsyncStorage: ${error}`);
    }
  };

  // Display toast is Async Storage was not updated
  useEffect(() => {
    if (updateAsyncStorageErrorMsg) {
      Toast.show({
        type: "error",
        text1: updateAsyncStorageErrorMsg,
        text2: "Please restart the application before trying again.",
        position: "top",
        autoHide: true,
      });
    }
  }, [updateAsyncStorageErrorMsg]);

  return (
    <View style={styles.wrap}>
      <View style={styles.cardContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.busStopName}>{updatedBusStopName}</Text>
          <Text style={styles.distanceAwayText}>
            {Number(item.distanceAway) < 1
              ? `~${(Number(item.distanceAway) * 1000).toFixed(0)}m away`
              : `~${Number(item.distanceAway).toFixed(2)}km away`}
          </Text>
        </View>
        <View style={styles.nusTagAndChevronContainer}>
          {item.busStopName.startsWith("NUSSTOP") && <NUSTag />}
          <Pressable
            onPress={() => {
              toggleFavourite(item.busStopId);
            }}
            accessibilityLabel={`toggle-favourite-${item.busStopId}`}
          >
            <Ionicons
              name={favouriteState ? "star" : "star-outline"}
              size={24}
              color={favouriteState ? "#FFD700" : "#000"}
              style={{ marginHorizontal: 5 }}
            />
          </Pressable>
        </View>
      </View>

      <View
        style={{
          borderBottomColor: "#626262",
          borderBottomWidth: StyleSheet.hairlineWidth,
          marginHorizontal: 16,
        }}
      />

      <View style={styles.textContainer}>
        {item.savedBuses.map((bus: BusService, index: number) => {
          const firstArrivalTime = calculateMinutesDifference(bus.timings[0]);
          const secondArrivalTime = calculateMinutesDifference(bus.timings[1]);
          return (
            <View key={index} style={styles.detailRow}>
              <View style={styles.leftContainer}>
                <ColouredCircle color={mapBusServiceColour(bus.busNumber)} size={15} />
                <Text style={[styles.details, styles.busNumber]}>
                  {bus.busNumber.startsWith("PUB:") ? bus.busNumber.slice(4) : bus.busNumber}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Text
                  style={[styles.details, firstArrivalTime === "Arr." ? styles.urgentTimingText : styles.timingText]}
                  numberOfLines={1}
                >
                  {firstArrivalTime}
                </Text>
                <Text
                  style={[styles.details, secondArrivalTime === "Arr." ? styles.urgentTimingText : styles.timingText]}
                  numberOfLines={1}
                >
                  {secondArrivalTime}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Get favourite bus stops, retrieves timing from REST API (using fetchBusArrivalTimes function) and renders list of ExpandableBusStop
const CurrentBusStop = ({ currentBusStop, refreshLocation }: { currentBusStop: BusStop; refreshLocation: number }) => {
  const location = useUserLocation(refreshLocation);
  const [busStop, setBusStop] = useState<BusStop[]>([currentBusStop]);
  const [dataMutated, setDataMutated] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: fetchBusArrivalTimes,
    onSuccess: (data) => {
      setBusStop(data); // update bus stops with fetched data
      setDataMutated(true); // set data mutated to true
    },
    onError: (error) => {
      console.error("Error fetching bus arrival times: ", error);
    },
  });

  useEffect(() => {
    if (busStop && !dataMutated && location) {
      // Put busStop in favouriteBusStops array object per requirement by API (since we are reusing that endpoint)
      const favouriteBusStops: BusStop[] = busStop;
      const dataWithLocation = {
        latitude: location!.coords.latitude,
        longitude: location!.coords.longitude,
        favouriteBusStops,
      };
      mutate(dataWithLocation);
    }
  }, [busStop, dataMutated, mutate, location]);

  const handleRefresh = () => {
    setDataMutated(false); // Reset dataMutated to allow re-fetching
  };

  if (isPending) return <ActivityIndicator size="large" style={{ margin: 20 }} />;
  if (error)
    return (
      <ScrollView refreshControl={<RefreshControl refreshing={isPending} onRefresh={handleRefresh} />}>
        <View style={{ flex: 1, alignItems: "center", margin: 20 }}>
          <Text>An error has occurred: {error.message}. </Text>
          <Text>Pull down to try again.</Text>
        </View>
      </ScrollView>
    );

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isPending} onRefresh={handleRefresh} title="Pull down to refresh" />}
      contentContainerStyle={{ paddingVertical: 10 }}
    >
      <BusStopCard item={busStop[0]} />
    </ScrollView>
  );
};

const SingularBusStop = () => {
  const [refreshLocation, setRefreshLocation] = useState(0); // State to handle the re-retrieval of user location.

  const { busStopItem }: { busStopItem: string } = useLocalSearchParams();
  const currentBusStop = JSON.parse(busStopItem);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View style={{marginHorizontal: 10}}>
          <Pressable onPress={() => router.dismiss(1)} style={styles.closeButton}>
            <Ionicons name="arrow-back" color="848484" size={25} />
          </Pressable>
          <CurrentBusStop currentBusStop={currentBusStop} refreshLocation={refreshLocation} />
        </View>
      </SafeAreaView>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderColor: "#ccc",
    borderWidth: 0.5,
    marginVertical: 5,
    marginHorizontal: 10,
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
  urgentTimingText: {
    fontSize: 13,
    fontFamily: "Inter-Bold",
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
  closeButton: {
    alignSelf: "flex-start",
    marginHorizontal: 10,
  },
});

export default SingularBusStop;
