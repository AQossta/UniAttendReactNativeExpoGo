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

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Состояние для тёмного режима (в реальном приложении это может быть контекст)
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'light');

  // Пример данных пользователя
  const user = {
    email: 'qwrt@gmail.com',
    language: 'English',
  };

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
          onPress: () => {
            router.replace('/(main)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode((prev) => !prev);
    // В реальном приложении здесь можно обновить тему через контекст
  };

  // Динамические цвета в зависимости от темы
  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    toolbarBackground: colorScheme === 'light' ? '#2D3A56' : '#F3F4F6',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    textTertiary: colorScheme === 'light' ? '#9CA3AF' : '#4B5563',
    divider: colorScheme === 'light' ? '#4B5563' : '#D1D5DB',
    exitButton: '#EF4444',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Toolbar */}
      <View
        style={[styles.toolbar, { backgroundColor: colors.toolbarBackground }]}
      >
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.toolbarText, { color: colors.textPrimary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.toolbarTitle, { color: colors.textPrimary }]}>
          My Profile
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={[styles.toolbarText, { color: colors.exitButton }]}>
            Exit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Аватар */}
      <Image
        source={require('../../assets/images/icon_profile.png')}
        style={styles.avatar}
      />

      {/* Заголовок */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        My Profile
      </Text>

      {/* Email */}
      <Text style={[styles.email, { color: colors.textSecondary }]}>
        {user.email}
      </Text>

      {/* Список опций */}
      <View style={styles.optionsContainer}>
        {/* Personal Data */}
        <TouchableOpacity style={styles.option}>
          <Text style={[styles.optionText, { color: colors.textTertiary }]}>
            Personal Data
          </Text>
          <Image
            source={require('../../assets/images/ic_button_next.svg')}
            style={[styles.arrow, { tintColor: colors.textTertiary }]}
          />
        </TouchableOpacity>

        {/* Разделитель */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Change Password */}
        <TouchableOpacity style={styles.option}>
          <Text style={[styles.optionText, { color: colors.textTertiary }]}>
            Change your password
          </Text>
          <Image
            source={require('../../assets/images/ic_button_next.svg')}
            style={[styles.arrow, { tintColor: colors.textTertiary }]}
          />
        </TouchableOpacity>

        {/* Разделитель */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Change Language */}
        <TouchableOpacity style={styles.option}>
          <Text style={[styles.optionText, { color: colors.textTertiary }]}>
            Language
          </Text>
          <View style={styles.languageContainer}>
            <Text
              style={[styles.languageText, { color: colors.textSecondary }]}
            >
              {user.language}
            </Text>
            <Image
              source={require('../../assets/images/ic_button_next.svg')}
              style={[styles.arrow, { tintColor: colors.textTertiary }]}
            />
          </View>
        </TouchableOpacity>

        {/* Разделитель */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Dark Mode Switch */}
        <View style={styles.option}>
          <Text style={[styles.optionText, { color: colors.textTertiary }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{
              false: '#D1D5DB',
              true: Colors[colorScheme ?? 'light'].tint,
            }}
            thumbColor="#FFFFFF"
            style={styles.switch}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbarText: {
    fontSize: 18,
    fontWeight: '500',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatar: {
    width: 96, // 24dp
    height: 96, // 24dp
    marginTop: 32, // 32dp
    alignSelf: 'center',
  },
  title: {
    fontSize: 24, // 24dp
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 24, // 24dp
    marginTop: 32, // 32dp
  },
  email: {
    fontSize: 14, // 14dp
    fontWeight: '400',
    textAlign: 'center',
    marginHorizontal: 24, // 24dp
    marginTop: 8, // 8dp
  },
  optionsContainer: {
    marginHorizontal: 24, // 24dp
    marginTop: 24, // 24dp
    marginBottom: 24, // 24dp
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64, // 64dp
  },
  optionText: {
    fontSize: 16, // 16dp
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12, // 12dp
    fontWeight: '600',
    marginRight: 14, // 14dp
  },
  arrow: {
    width: 24, // 6dp (примерно)
    height: 24, // 6dp (примерно)
  },
  divider: {
    height: 1, // 1dp
    marginVertical: 4, // 4dp
  },
  switch: {
    width: 67, // 67dp
    height: 36, // 36dp
  },
});