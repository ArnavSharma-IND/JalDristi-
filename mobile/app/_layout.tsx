import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Droplets, Bell, MapPin, Layers } from 'lucide-react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0b1120',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '800',
          },
          tabBarStyle: {
            backgroundColor: '#0b1120',
            borderTopColor: '#1e293b',
          },
          tabBarActiveTintColor: '#0ea5e9',
          tabBarInactiveTintColor: '#64748b',
        }}
      >
        <Tabs.Screen
          name="(tabs)/index"
          options={{
            title: 'Telemetry',
            headerTitle: 'JalDrishti DWLR',
            tabBarIcon: ({ color, size }) => <Droplets color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/alerts"
          options={{
            title: 'Alert Feed',
            headerTitle: 'Active Risk Alerts',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/districts"
          options={{
            title: 'Districts',
            headerTitle: 'District Groundwater Status',
            tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="station/[id]"
          options={{
            href: null,
            title: 'Station Analysis',
          }}
        />
      </Tabs>
    </>
  );
}
