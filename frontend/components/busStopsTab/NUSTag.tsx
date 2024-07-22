import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const NUSTag = () => {
  return (
    <View style={styles.nusTag}>
      <Text style={styles.nusTagText}>NUS</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  nusTag: {
    backgroundColor: "#27187E",
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 5,
  },
  nusTagText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    color: "#EBF3FE",
  },
});
