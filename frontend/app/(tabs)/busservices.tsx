import React from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  Polygon,
  Polyline,
} from "react-native-maps";

export default function NUSBusServices() {
  const NUS = {
    latitude: 1.2966,
    longitude: 103.7764,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  return (
    <View style={styles.mapContainer}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={NUS}>
        <Polyline
          coordinates={[
            { latitude: 1.29453, longitude: 103.769924 },
            { latitude: 1.294552, longitude: 103.770635 },
            { latitude: 1.293223, longitude: 103.775068 },
            { latitude: 1.293789, longitude: 103.776715 },
            { latitude: 1.291765, longitude: 103.780419 },
            { latitude: 1.29483, longitude: 103.784439 },
            { latitude: 1.297421, longitude: 103.780941 },
            { latitude: 1.29483, longitude: 103.784439 },
            { latitude: 1.297421, longitude: 103.780941 },
            { latitude: 1.297372, longitude: 103.778075 },
            { latitude: 1.298786, longitude: 103.77563 },
            { latitude: 1.298885, longitude: 103.774377 },
            { latitude: 1.296544, longitude: 103.772569 },
            { latitude: 1.29453, longitude: 103.769924 },
          ]}
          strokeColor="#27f"
          strokeWidth={6}
          tappable={false}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: "50%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
