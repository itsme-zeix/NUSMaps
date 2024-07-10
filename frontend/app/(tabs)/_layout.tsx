import { Tabs } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0163CF",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bus Stops",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "bus" : "bus-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="routefindingScreens"
        options={{
          title: "Search Route",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "map" : "map-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="busservices"
        options={{
          title: "NUS Bus Location",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "location" : "location-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
