import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { determineFontColor } from "./determineFontColor";
import { getColorForPublicTransport } from "@/utils/getColorForPublicTransport";

interface BusNumberType {
  busNumber: string;
  busType: string;
  testID: string;
}

export const BusNumberCard: React.FC<BusNumberType> = ({ busNumber, busType, testID }) => {
  const backgroundColor = getColorForPublicTransport(busType, busNumber);
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
