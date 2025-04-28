import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';
import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../src/constants/Colors';
import { useColorScheme } from '../../src/hooks/useColorScheme';

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require('../../assets/images/icon_action_home.svg')}
                className="w-7 h-7"
                style={{ tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="qr-scan"
          options={{
            title: 'QR-code',
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require('../../assets/images/qr-code-svgrepo-com.svg')}
                className="w-7 h-7"
                style={{ tintColor: color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require('../../assets/images/icon_action_profile.svg')}
                className="w-7 h-7"
                style={{ tintColor: color }}
              />
            ),
          }}
        />
      </Tabs>
  );
}