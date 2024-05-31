import React from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  StatusBar,
} from "react-native";
import BusStopSearchBar from "@/components/BusStopSearchBar";

interface BusService {
  busNumber: string;
  timings: number[];
}

interface BusStop {
  busStopName: string;
  distanceAway: string;
  savedBuses: BusService[];
}

const ClementiMRT: BusStop = {
  busStopName: "Clementi MRT",
  distanceAway: "~20m away",
  savedBuses: [
    {
      busNumber: "96",
      timings: [2, 17],
    },
    {
      busNumber: "96A",
      timings: [2, 6],
    },
  ],
};

const KRMRT: BusStop = {
  busStopName: "Kent Ridge MRT",
  distanceAway: "~1500m away",
  savedBuses: [
    {
      busNumber: "D1",
      timings: [2, 7],
    },
    {
      busNumber: "A1",
      timings: [3, 9],
    },
    {
      busNumber: "K",
      timings: [1, 12],
    },
  ],
};

const busStops: BusStop[] = [ClementiMRT, KRMRT];

const busCard = (bus: BusService) => {
  return (
    <View style={styles.busCard}>
      <Text style={{ fontSize: 24 }}> {bus.busNumber} </Text>
      <Text style={{ fontSize: 10 }}> Arrival Time </Text>
      <View style={styles.busTimings}>
        <View style={styles.busTiming}>
          <Text style={{ color: "#30B800", fontSize: 22 }}>
            {bus.timings[0]}
          </Text>
          <Text style={{ color: "#30B800", fontSize: 12 }}>min</Text>
        </View>
        <View style={styles.busTiming}>
          <Text style={{ color: "#DE8500", fontSize: 22 }}>
            {bus.timings[1]}
          </Text>
          <Text style={{ color: "#DE8500", fontSize: 12 }}>min</Text>
        </View>
      </View>
    </View>
  );
};

const busStopCard = (busStop: BusStop) => {
  return (
    <View style={styles.busStopCard}>
      <View>
        <Text style={{ fontSize: 20 }}> {busStop.busStopName} </Text>
        <Text style={{ color: "626262", fontSize: 10 }}>
          {" "}
          {busStop.distanceAway}{" "}
        </Text>
      </View>
      <View style={styles.busTimings}>
        <Text>
          {busStop.savedBuses.map((bus: BusService, index: number) => (
            <View key={index}>{busCard(bus)}</View>
          ))}
        </Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeAreaViewContainer}>
      <BusStopSearchBar></BusStopSearchBar>
      <ScrollView style={styles.scrollView}>
        {busStops.map((busStop, index) => (
          <View key={index}>{busStopCard(busStop)}</View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaViewContainer: {
    flex: 1,
    flexDirection: "column",
  },
  scrollView: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },
  busCard: {
    height: 80,
    width: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 6,
    marginTop: 8,
    marginHorizontal: 8,
    justifyContent: "flex-start",
  },
  busTimings: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  busTiming: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  busStopCard: {
    borderColor: "#ccc",
    borderWidth: 1,
    marginVertical: 8,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
