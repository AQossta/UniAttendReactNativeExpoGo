import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../src/constants/Colors';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';

interface Role {
  name: string;
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('User roles in TabsLayout:', user.roles);
    } else {
      console.log('User not loaded yet in TabsLayout');
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const isStudent = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles.some(role => {
        if (typeof role === 'string') {
          return role.toLowerCase() === 'student';
        } else if (role && 'name' in role) {
          return role.name.toLowerCase() === 'student';
        }
        return false;
      })
    : false;

  const isTeacher = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles.some(role => {
        if (typeof role === 'string') {
          return role.toLowerCase() === 'teacher';
        } else if (role && 'name' in role) {
          return role.name.toLowerCase() === 'teacher';
        }
        return false;
      })
    : false;

  console.log('isStudent:', isStudent, 'isTeacher:', isTeacher);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Голубой для активной вкладки
        tabBarInactiveTintColor: '#9CA3AF', // Серый для неактивной
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 60,
            paddingBottom: 10,
            backgroundColor: '#FFFFFF', // Белый фон для TabBar
            borderTopWidth: 1,
            borderTopColor: '#0000001A', // Тонкая линия сверху, как на изображении
          },
          default: {
            height: 60,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#0000001A',
          },
        }),
        tabBarLabelStyle: { display: 'none' },
        unmountOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      {isTeacher && (
        <Tabs.Screen
          name="(teacher-tabs)/create_schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="event" size={24} color={color} />
            ),
          }}
        />
      )}
      {isStudent && (
        <Tabs.Screen
          name="(student-tabs)/qr-scan"
          options={{
            title: 'QR-code',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="qr-code" size={24} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}