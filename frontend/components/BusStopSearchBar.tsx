import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import BusStopsSearchBarResultScreen from "./BusStopSearchResultsScreen";
import { createStackNavigator } from "@react-navigation/stack";

export default function BusStopSearchBar() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handlePress = () => {
    setShowResults(true);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
          },
          styles.wrapperCustom,
        ]}
      >
        <TextInput
          placeholder="Press me"
          onChangeText={(newText) => {
            setQuery(newText);
            console.log(newText);
          }}
          value={query}
        />
      </Pressable>
      {showResults && (
        <BusStopsSearchBarResultScreen
          initialQuery={query}
          onClose={() => setShowResults(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
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
