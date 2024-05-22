import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import Card from "../../components/Card";
import BusStopSearchBar from "@/components/BusStopSearchBar";

export default function BusStopsScreen() {
  return (
    <SafeAreaView>
      <BusStopSearchBar></BusStopSearchBar>
      <Card>
        <Text>Open up App.js to start working on your app!</Text>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
