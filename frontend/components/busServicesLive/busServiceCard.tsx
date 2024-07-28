import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ColouredCircle from "@/components/ColouredCircle";
import mapBusServiceColour from "@/utils/mapBusServiceColor";

interface ServiceCardProps {
  busService: string;
  busStops: string[]; // the stops shown in the detailed screen
  displayedStops: string[]; // the stops that are shown in the card
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ busService, busStops, displayedStops }) => {
  // it will pass a json with the service and the bus stop
  // add pressable
  let stops = displayedStops.flatMap((stop: string) => [stop, "rightArrow"]);
  stops.pop(); //removes the last arrow
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardContentContainer}>
        <ColouredCircle color={mapBusServiceColour(busService)} size={15} />
        <View style={styles.textContainer}>
          <Text style={{ fontFamily: "Inter-Bold" }}>{busService}</Text>
          <View style={styles.busStopArrowContainer}>
            {stops.map((stop, index) => {
              if (stop == "rightArrow") {
                return <MaterialCommunityIcons key={index} name="chevron-right" size={20} color="black" />;
              } else {
                return (
                  <Text style={{ fontFamily: "Inter" }} key={index}>
                    {stop}
                  </Text>
                );
              }
            })}
          </View>
        </View>
      </View>
    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textContainer: {
    marginHorizontal: 8,
  },
  busStopArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
});
