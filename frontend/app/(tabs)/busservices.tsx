import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region, Polygon } from 'react-native-maps'

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
        <Polygon
          coordinates={[
            { latitude: 1.29453, longitude: 103.769924 },
            { latitude: 1.294552, longitude: 103.771475 },
            { latitude: 1.293619, longitude: 103.771475 },
            { latitude: 1.293223, longitude: 103.775068 },
          ]}
          strokeColor="#27f"
          strokeWidth={0.01}
          tappable={false}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: '50%',
  },
  map: {
    width: '100%',
    height: '100%',
  }
});
