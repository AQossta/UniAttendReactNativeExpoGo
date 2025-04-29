import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { Colors } from '../../src/constants/Colors';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, setIsAuthenticated } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'light');

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await setIsAuthenticated(false);
            router.replace('/(main)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    toolbarBackground: colorScheme === 'light' ? '#2D3A56' : '#F3F4F6',
    cardBackground: colorScheme === 'light' ? '#2D3A56' : '#F3F4F6',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    textTertiary: colorScheme === 'light' ? '#9CA3AF' : '#4B5563',
    divider: colorScheme === 'light' ? '#4B5563' : '#D1D5DB',
    exitButton: '#007BFF',
    accent: Colors[colorScheme ?? 'light'].tint || '#007AFF',
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.toolbar, { backgroundColor: colors.toolbarBackground }]}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.toolbarText, { color: colors.textPrimary }]}>
              Назад
            </Text>
          </TouchableOpacity>
          <Text style={[styles.toolbarTitle, { color: colors.textPrimary }]}>
            Мой профиль
          </Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={[styles.toolbarText, { color: colors.exitButton }]}>
              Выйти
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
          <Image
            source={require('../../assets/images/icon_profile.png')}
            style={styles.avatar}
          />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
          Мой профиль
          </Text>
          {user ? (
            <>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
              <Text style={[styles.name, { color: colors.textSecondary }]}>
                {user.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              Загрузка данных пользователя...
            </Text>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textTertiary }]}>
              Личные данные
            </Text>
            <Image
              source={require('../../assets/images/ic_button_next.png')}
              style={[styles.arrow, { tintColor: colors.textTertiary }]}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textTertiary }]}>
              Изменить пароль
            </Text>
            <Image
              source={require('../../assets/images/ic_button_next.png')}
              style={[styles.arrow, { tintColor: colors.textTertiary }]}
            />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textTertiary }]}>
              Язык
            </Text>
            <View style={styles.languageContainer}>
              <Image
                source={require('../../assets/images/ic_button_next.png')}
                style={[styles.arrow, { tintColor: colors.textTertiary }]}
              />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.option}>
            <Text style={[styles.optionText, { color: colors.textTertiary }]}>
              Темная тема
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{
                false: '#D1D5DB',
                true: colors.accent,
              }}
              thumbColor="#FFFFFF"
              style={styles.switch}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.exitButton }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    paddingBottom: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  toolbarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 24,
    marginTop: 32,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  email: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    marginHorizontal: 24,
    marginTop: 32,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    width: 24,
    height: 24,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  switch: {
    width: 67,
    height: 36,
  },
  logoutButton: {
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});