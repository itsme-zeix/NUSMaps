import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, LatLng } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';

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
      <View style={styles.stopContainer}>
        <View style={[{ backgroundColor: determineBG(crowdLevel) }, styles.crowdLevelRectangle]} />
        <View style={styles.textContainer}>
          <Text style={styles.markerText}>{vehicleLicensePlate}</Text>
        </View>
      </View>
      <FontAwesome5 name="bus" size={16} color="orange" style={styles.iconStyle} />
    </Marker>
  );
};

const styles = StyleSheet.create({
  stopContainer: {
    flexDirection: 'column', // Layout children in a row
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'orange', // Set the background color to orange
    padding: 5,
    borderRadius: 5,
  },
  crowdLevelRectangle: {
    width:20,
    height:5
  },
  textContainer: {
    flexDirection:'row'
  },
  markerText: {
    color: 'white',
    padding: 2,
    borderRadius: 3,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize:8
  },
  iconStyle: {
    alignSelf:'center'
  },
});

export default ActiveBusMarker;