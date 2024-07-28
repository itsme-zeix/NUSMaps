import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, LatLng } from "react-native-maps";
import { FontAwesome5 } from "@expo/vector-icons";

const determineBG = (crowdLevel: string) => {
  if (crowdLevel == "low") {
    return "green";
  } else if (crowdLevel == "medium") {
    return "yellow";
  } else if (crowdLevel == "high") {
    return "red";
  } else {
    return "grey";
  }
};

type ActiveBusMarkerProps = {
  coordinate: LatLng;
  vehicleLicensePlate: string;
  crowdLevel: string;
};

const ActiveBusMarker: React.FC<ActiveBusMarkerProps> = ({ coordinate, vehicleLicensePlate, crowdLevel }) => {
  return (
    <Marker coordinate={coordinate}>
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <View style={[{ backgroundColor: determineBG(crowdLevel) }, styles.crowdLevelRectangle]} />
          <View style={styles.textContainer}>
            <Text style={styles.markerText}>{vehicleLicensePlate}</Text>
          </View>
        </View>
        <View style={styles.busIconContainer}>
          <FontAwesome5 name="bus" size={16} color="white" style={styles.iconStyle} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#828282",
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 4 },
  },
  infoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#EF7C01",
  },
  crowdLevelRectangle: {
    width: 35,
    height: 5,
    margin: 2,
  },
  textContainer: {
    flexDirection: "row",
  },
  markerText: {
    color: "black",
    padding: 2,
    borderRadius: 3,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 8,
  },
  busIconContainer: {
    backgroundColor: "#EF7C01",
    height: 20,
    width: 20,
    borderRadius: 3,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  iconStyle: {
    alignSelf: "center",
  },
});

export default ActiveBusMarker;
