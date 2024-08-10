import React from "react";
import { View, StyleSheet, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { determineFontColor } from "./determineFontColor";
import { getColorForPublicTransport } from "@/utils/getColorForPublicTransport";

interface MRTServiceType {
  serviceType: string;
  testID: string;
}

export const SubwayTypeCard: React.FC<MRTServiceType> = ({ serviceType, testID }) => {
  const bgColor = getColorForPublicTransport("SUBWAY", serviceType);
  const fontColor = determineFontColor(bgColor);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }} testID={testID}>
      <MaterialIcons name="train" size={26} color="#434343" style={{ marginRight: 3 }} />
      <View style={[styles.MRTNumberContainer, { backgroundColor: bgColor }]}>
        <Text style={[styles.MRTNumber, { color: fontColor }]}>{serviceType}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  MRTNumberContainer: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  MRTNumber: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
  },
});
