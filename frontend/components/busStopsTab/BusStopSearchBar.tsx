import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { StackNavigationProp } from "@react-navigation/stack";

type BusStopSearchStackParamList = {
  BusStopSearchScreen: { initialQuery: string };
};

type BusStopSearchScreenNavigationProp = StackNavigationProp<BusStopSearchStackParamList, "BusStopSearchScreen">;

export default function BusStopSearchBar() {
  const navigation = useNavigation<BusStopSearchScreenNavigationProp>();

  const handlePress = () => {
    navigation.navigate("BusStopSearchScreen", { initialQuery: "" });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.searchBar}>
        {<Ionicons name="search" size={20} color="gray" />}
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
    flexDirection: "row",
  },
  buttonText: {
    fontSize: 16,
    color: "#909095",
    paddingLeft: 8,
  },
});
