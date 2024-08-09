import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ColouredCircle from "@/components/ColouredCircle";
import mapBusServiceColour from "@/utils/mapBusServiceColor";

interface ServiceCardProps {
  busService: string;
  busStops: string[]; // the stops shown in the detailed screen
  displayedStops: string[]; // the stops that are shown in the card
  onPress: () => void; // Function to handle press events
  selected: boolean; // Indicate if this card is selected
}

const ServiceCard: React.FC<ServiceCardProps> = ({ busService, busStops, displayedStops, onPress, selected }) => {
  const [isPressed, setIsPressed] = useState(false);
  let stops = displayedStops.flatMap((stop: string) => [stop, "rightArrow"]);
  stops.pop(); //removes the last arrow
  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: pressed || isPressed ? "#ced9e5" : selected ? "#e5f2ff" : "#fff",
          borderColor: selected ? "#007bff" : "#ccc",
          shadowOffset: { width: 0, height: pressed || isPressed ? 1 : selected ? 3 : 3 },
          shadowOpacity: pressed || isPressed ? 0.1 : selected ? 0.2 : 0.2,
        },
      ]}
    >
      <View style={styles.cardContentContainer}>
        <ColouredCircle color={mapBusServiceColour(busService)} size={15} />
        <View style={styles.textContainer}>
          <Text style={styles.busServiceText}>{busService}</Text>
          <View style={styles.busStopArrowContainer}>
            {stops.map((stop, index) => {
              if (stop == "rightArrow") {
                return <MaterialCommunityIcons key={index} name="chevron-right" size={20} color="black" />;
              } else {
                return (
                  <Text style={styles.stopText} key={index}>
                    {stop}
                  </Text>
                );
              }
            })}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 0.5,
    marginVertical: 5,
    marginHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
  },
  cardContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textContainer: {
    marginHorizontal: 12,
    flex: 1, // Allow the text container to take up remaining space
  },
  busStopArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  busServiceText: {
    fontFamily: "Inter-Bold",
    marginBottom: 4, // Add some space between bus service text and stops
  },
  stopText: {
    fontFamily: "Inter-Regular",
  },
});

export default ServiceCard;
