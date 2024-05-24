import React from 'react';
import MapView from 'react-native-maps';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import BusStopSearchBar from '@/components/BusStopSearchBar';

export default function App() {
  return (
    <View>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} />
      <View style={styles.overlay} >
        <BusStopSearchBar></BusStopSearchBar>
      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    alignContent: 'center',
    width: "100%",
    backgroundColor: 'rgba(255, 255, 255, 0)',
  }
});