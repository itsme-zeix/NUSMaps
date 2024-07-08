// src/components/BusStopSearchBar.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function BusStopSearchBar() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("BusStopSearchScreen", { initialQuery: "" });
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
          },
          styles.searchBar,
        ]}
      >
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    width: "93%",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 16,
    textAlign: "center",
    backgroundColor: "#EBEBEC",
  },
  buttonText: {
    fontSize: 16,
    color: "#909095",
  },
});
