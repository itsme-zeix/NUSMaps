import React, { useEffect, useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView, Text } from "react-native";
import * as SQLite from 'expo-sqlite';
import BusStopSearchBar from "@/components/BusStopSearchBar";

// Define interfaces for BusService and BusStop
interface BusService {
  busNumber: string;
  timings: string[]; // ISO format
}

interface BusStop {
  busStopName: string;
  busId: string;
  distanceAway: string;
  savedBuses: BusService[];
};

/* FOR TESTING PURPOSES */
const bus106: BusService = {
  busNumber: "106",
  timings: [],
};

const bus852: BusService = {
  busNumber: "852",
  timings: [],
};

const bukitBatokInt: BusStop = {
  busStopName: "Bukit Batok Int",
  busId: "43009",
  distanceAway: "~5m away",
  savedBuses: [bus106, bus852],
};
/* END OF TESTING PURPOSES */

// Function to fetch bus timings
async function fetchBusTimings(busStops: BusStop[]) {
  try {
    const response = await fetch(
      "https://nusmaps.onrender.com/busArrivalTimes", // TODO: add authentication
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(busStops),
      }
    );
    const apiReply = await response.json();
    console.log(apiReply);
    return apiReply; // return back busStops array with 'timings' in BusService filled in
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

// Calculate the difference in minutes between the current time and the given ISO time
const calculateMinutesDifference = (isoTime: string): string | number => {
  const now = new Date();
  const busTime = new Date(isoTime);

  if (isNaN(busTime.getTime())) {
    // If busTime is invalid, return a default value or handle the error
    return "N/A";
  }

  const differenceInMilliseconds = busTime.getTime() - now.getTime();
  const differenceInMinutes = Math.round(differenceInMilliseconds / 1000 / 60);
  return differenceInMinutes >= 0 ? differenceInMinutes : 0;
  console.log(differenceInMinutes);
};

const busCard = (bus: BusService) => {
  // Calculate the arrival times in minutes
  const arrivalTimesInMinutes = bus.timings.map((timing: string) =>
    calculateMinutesDifference(timing)
  );

  return (
    <View style={styles.busCard}>
      <Text style={{ fontSize: 24 }}> {bus.busNumber} </Text>
      <Text style={{ fontSize: 10 }}> Arrival Time </Text>
      <View style={styles.busTimings}>
        <View style={styles.busTiming}>
          <Text style={{ color: "#30B800", fontSize: 22 }}>
            {arrivalTimesInMinutes[0]}
          </Text>
          <Text style={{ color: "#30B800", fontSize: 12 }}>min</Text>
        </View>
        <View style={styles.busTiming}>
          <Text style={{ color: "#DE8500", fontSize: 22 }}>
            {arrivalTimesInMinutes[1]}
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
        <Text style={{ color: "#626262", fontSize: 10 }}>
          {busStop.distanceAway}
        </Text>
      </View>
      <View style={styles.busTimings}>
        {busStop.savedBuses.map((bus: BusService, index: number) => (
          <View key={index}>{busCard(bus)}</View>
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [busStops, setBusStopsData] = useState<BusStop[]>([bukitBatokInt]); // bukitBatokInt FOR TESTING PURPOSES, replace w local storage
  const [isloadingFirstTime, setIsLoadingFirstTime] = useState(true); // to change
  useEffect(() => {
    const fetchAndSetBusTimings = async () => {
      const updatedBusStops = await fetchBusTimings(busStops);
      setBusStopsData(updatedBusStops);
      console.log(updatedBusStops[0].savedBuses[0]);
    };
    
    fetchAndSetBusTimings(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchAndSetBusTimings();
    }, 30000); // 30000 milliseconds = 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  return (
    <SafeAreaView style={styles.safeAreaViewContainer}>
      <BusStopSearchBar />
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
