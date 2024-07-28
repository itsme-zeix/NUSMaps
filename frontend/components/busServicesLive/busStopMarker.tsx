import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface CustomMarkerProps {
  stopName: string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ stopName }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{stopName}</Text>
      </View>
      <View style={styles.iconContainer}>
        <Svg height="40" width="30" viewBox="0 0 24 24" style={styles.svg}>
          <Rect x="4.5" y="4.5" width={15} height={15} rx="2" ry="2" fill="grey" />
        </Svg>
        <MaterialCommunityIcons name="bus-stop" size={18} color="white" style={styles.icon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    opacity: 0.75,
  },
  iconContainer: {
    position: "relative",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
  },
  svg: {
    position: "absolute",
  },
  textContainer: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#848484",
    shadowColor: "#212121",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    fontSize: 10,
    fontFamily: "Inter-Semibold",
  },
});

export default CustomMarker;
