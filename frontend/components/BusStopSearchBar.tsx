import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function BusStopSearchBar() {
  const handlePress = () => {
    console.log("Search bar pressed (to expand)");
  };

  return (
    <Pressable
      onPress={() => handlePress}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
        },
        styles.wrapperCustom,
      ]}
    >
      {({ pressed }) => (
        <Text style={styles.text}>{pressed ? "Pressed!" : "Press Me"}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "#828282",
  },
  wrapperCustom: {
    borderRadius: 12,
    padding: 13,
    margin: 16,
    textAlign: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#828282",
  },
});
