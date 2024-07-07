import { Tabs } from 'expo-router';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routefindingScreens"
        options={{
          title: 'Search Route',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="busservices"
        options={{
          title: 'Bus Services',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

{/* <Tabs.Screen
  name="RefactoredResultsScreen"
  options={{
    title: 'Results',
    tabBarButton: () => null,
  }}
/>
 <Tabs.Screen
  name="DetailedRouteScreen"
  options={{
    title: 'Detailed',
    tabBarButton: () => null,
  }}
/> */}