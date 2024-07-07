import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
    <Stack
        screenOptions={{
            headerShown : false
        }}>
        <Stack.Screen name = "Main"/>
        <Stack.Screen name = "ResultsScreen"/>
        <Stack.Screen name = "DetailedRouteScreen"/>
    </Stack>
  );
};
