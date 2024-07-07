import { Tabs, Stack } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
