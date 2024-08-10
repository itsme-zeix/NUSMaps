import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { determineFontColor } from "./determineFontColor";

interface BusNumberType {
  busNumber: string;
  busType: string;
  testID: string;
}

const determineBusBG = (busNumber: string) => {
  switch (busNumber) {
    case "A1":
      return "#FF0000";
    case "A2":
      return "#E4CE0C";
    case "D1":
      return "#CD82E2";
    case "D2":
      return "#6F1B6F";
    case "BTC":
      return "#EE8136";
    case "K":
      return "#345A9B";
    case "L":
      return "#BFBFBF";
    default:
      return "#4ABF50"; // Default to PUBLICBUSBG color
  }
};

export const BusNumberCard: React.FC<BusNumberType> = ({ busNumber, busType, testID }) => {
  const backgroundColor = busType === "NUS_BUS" ? determineBusBG(busNumber) : "#4ABF50";
  const fontColor = determineFontColor(backgroundColor);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} testID={testID}>
      <Ionicons name="bus" size={23} color="#434343" style={{ marginRight: 3 }} />
      <View style={[styles.busNumberContainer, { backgroundColor }]}>
        <Text style={[styles.busNumber, { color: fontColor }]}>{busNumber}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  busNumberContainer: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  busNumber: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
  },
});
