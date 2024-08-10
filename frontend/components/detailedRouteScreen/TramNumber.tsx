import React from "react";
import { View, StyleSheet, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { determineFontColor } from "./determineFontColor";
import { getColorForPublicTransport } from "@/utils/getColorForPublicTransport";

interface TramServiceType {
  serviceType: string;
  legType: string;
  testID: string;
}

export const TramTypeCard: React.FC<TramServiceType> = ({ serviceType, legType, testID }) => {
  const backgroundColor = getColorForPublicTransport(legType, serviceType);
  const fontColor = determineFontColor(backgroundColor);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} testID={testID}>
      <MaterialIcons name="tram" size={20} color="#434343" style={{ marginRight: 3 }} />
      <View style={[styles.LRTNumberContainer, { backgroundColor }]}>
        <Text style={[styles.LRTNumber, { color: fontColor }]}>{serviceType}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  LRTNumberContainer: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  LRTNumber: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
  },
});
