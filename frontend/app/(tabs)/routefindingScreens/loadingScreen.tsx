import React from "react";
import {Text, StyleSheet, View} from "react-native";
const WaitingScreen = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please wait, processing your request...</Text>
      </View>
    );
  };
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});  

export default WaitingScreen;