import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomMarkerProps {
    stopName:string
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ stopName }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{stopName}</Text>
      </View>
      <Svg height="40" width="30" viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="10" fill="#4CAF50" />
        <Path
          d="M12 22C12 22 4 14 4 9C4 4.02944 8.02944 0 12 0C15.9706 0 20 4.02944 20 9C20 14 12 22 12 22Z"
          fill="#4CAF50"
        />
      </Svg>
      <MaterialCommunityIcons
        name="bus-stop"
        size={18}
        color="white"
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexDirection: 'column',
  },
  icon: {
    position: 'absolute',
    top: 35,
  },
  textContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 9,
    color: '#4CAF50',
  },
});

export default CustomMarker;
