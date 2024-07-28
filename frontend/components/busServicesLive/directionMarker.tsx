import React from "react";
import { View, StyleSheet } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

type DirectionMarkerProps = {
  angle: string;
};

const DirectionMaker: React.FC<DirectionMarkerProps> = ({ angle }) => {
  return (
    <View style={styles.iconContainer}>
      <FontAwesome name="location-arrow" size={24} color="orange" style={{ transform: [{ rotate: angle }] }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexDirection: "column",
  },
  textContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "white",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: -5,
  },
  text: {
    fontSize: 10,
    color: "#4CAF50",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    width: 20,
    height: 20,
    borderRadius: 20,
    position: "relative",
  },
  icon: {
    transform: [{ rotate: "45deg" }], // Rotate the icon to point downwards
    position: "absolute",
  },
});

export default DirectionMaker;
