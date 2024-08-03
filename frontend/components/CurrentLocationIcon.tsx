import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CurrentLocationIcon = () => {
  return (
    <View style={styles.container}>
      <Svg height="30" width="30" viewBox="0 0 100 100">
        {/* Outer Blue Circle */}
        <Circle cx="50" cy="50" r="50" fill="rgba(0, 122, 255, 0.2)" />
        
        {/* White Middle Circle */}
        <Circle cx="50" cy="50" r="30" fill="rgba(255, 255, 255, 0.5)" />
        
        {/* Inner Blue Circle */}
        <Circle cx="50" cy="50" r="20" fill="#007AFF" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default CurrentLocationIcon;
