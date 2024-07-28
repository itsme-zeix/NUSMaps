import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { determineFontColor } from "./determineFontColor";

interface busNumberType {
  busNumber: string;
  busType: string;
  testID:string;
}

export const BusNumberCard: React.FC<busNumberType> = ({ busNumber, busType, testID }) => {
  const busBackgroundColor = busType === "NUS_BUS" ? busBGMapping[busNumber] : styles.PUBLICBUSBG;
  const backgroundColor = busBackgroundColor.backgroundColor;
  const fontColor = determineFontColor(backgroundColor);

  
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center"  }} testID={testID}>
      <Ionicons name="bus" size={23} color="#434343" style={{ marginRight: 3 }} />
      <View style={[styles.busNumberContainer, busBackgroundColor]}>
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
    fontFamily: "Inter-Bold",
    fontSize: 15,
  },
  PUBLICBUSBG: {
    backgroundColor: "#4ABF50",
  },
  D1: {
    backgroundColor: "#CD82E2",
  },
  D2: {
    backgroundColor: "#6F1B6F",
  },
  A1: {
    backgroundColor: "#FF0000",
  },
  A2: {
    backgroundColor: "#E4CE0C",
  },
  BTC: {
    backgroundColor: "#EE8136",
  },
  K: {
    backgroundColor: "#345A9B",
  },
  L: {
    backgroundColor: "#BFBFBF",
  },
});

const busBGMapping = {
  A1: styles.A1,
  A2: styles.A2,
  D1: styles.D1,
  D2: styles.D2,
  BTC: styles.BTC,
  K: styles.K,
  L: styles.L,
};
