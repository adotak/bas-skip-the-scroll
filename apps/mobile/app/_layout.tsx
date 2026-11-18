import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="deck/[id]"
          options={{
            title: '',
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="end/[id]"
          options={{
            title: '',
            headerShown: false,
            gestureEnabled: false, // prevent swiping back to deck
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="library"
          options={{
            headerShown: false,
            title: 'Saved Library',
          }}
        />
        <Stack.Screen
          name="insights"
          options={{
            headerShown: false,
            title: 'Insights',
          }}
        />
        <Stack.Screen
          name="gate"
          options={{
            headerShown: false,
            title: 'Pause Gate',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
