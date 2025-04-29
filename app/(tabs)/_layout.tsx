import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';
import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../src/constants/Colors';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth(); 

  const isStudent = user?.roles.includes('student');
  const isTeacher = user?.roles.includes('teacher');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, 
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 60, 
            paddingBottom: 10,
          },
          default: {
            height: 60,
          },
        }),
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/icon_action_home.png')}
              className="w-3 h-3"
              style={{ tintColor: color }}
            />
          ),
        }}
      />
      {/* Conditionally render create_schedule tab for teachers only */}
      {isTeacher && (
        <Tabs.Screen
          name="(teacher-tabs)/create_schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color }) => (
              <Image
                source={require('../../assets/images/create_schedule.png')}
                className="w-3 h-3"
                style={{ tintColor: color }}
              />
            ),
          }}
        />
      )}
      {/* Conditionally render qr-scan tab for students only */}
      {isStudent && (
        <Tabs.Screen
          name="(student-tabs)/qr-scan"
          options={{
            title: 'QR-code',
            tabBarIcon: ({ color }) => (
              <Image
                source={require('../../assets/images/qr-code-svgrepo-com.png')}
                className="w-3 h-3"
                style={{ tintColor: color }}
              />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/icon_action_profile.png')}
              className="w-3 h-3"
              style={{ tintColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}