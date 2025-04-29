import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_AUTH_SIGN_IN } from '../api/API';

const COLORS = {
  grey_900: '#111827',
  grey_500: '#6B7280',
  grey_400: '#9CA3AF',
  red: '#EF4444',
  blue: '#3B82F6',
  white: '#FFFFFF',
  fui_transparent: 'transparent',
};

export default function LoginScreen() {
  const { setIsAuthenticated, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    // Валидация
    if (!email.includes('@')) {
      setEmailError(true);
      setServerError('');
      return;
    }
    if (password.length < 5) {
      setServerError('Неверный пароль (минимум 6 символов)');
      setEmailError(false);
      return;
    }

    setEmailError(false);
    setServerError('');
    setIsLoading(true);

    try {
      // Вызов API с помощью axios
      const response = await axios.post(API_AUTH_SIGN_IN, {
        email,
        password,
      });

      const { body, message } = response.data;

      // Сохранение токена и данных пользователя
      await AsyncStorage.setItem('accessToken', body.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(body));

      // Обновление AuthContext
      await setIsAuthenticated(true);
      await setUser({
        id: body.id,
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth,
        roles: body.roles,
        groupId: body.groupId,
        groupName: body.groupName,
        accessToken: body.accessToken,
      });

      // Перенаправление на вкладку профиля
      router.replace('/(tabs)/profile');
    } catch (error: any) {
      // Обработка ошибок axios
      const errorMessage =
        error.response?.data?.message || error.message || 'Ошибка сервера';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/ic_logo.png')}
        style={styles.logoApp}
      />
      <Text style={styles.textSalem}>Салем</Text>
      <Text style={styles.textAccLogin}>Аккаунтқа кіріңіз</Text>
      <Text style={styles.textEmail}>Email</Text>
      <View style={styles.linearLayout}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.editTextEmail}
            placeholder="Сіздің Email"
            placeholderTextColor={COLORS.grey_400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
        {emailError && (
          <Text style={styles.tvErrorTextEmail}>Қате формат</Text>
        )}
      </View>
      <View style={styles.passwordContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.editTextPassword}
            placeholder="Сіздің құпия сөзіңіз"
            placeholderTextColor={COLORS.grey_400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.btnShowPassword}
            onPress={toggleShowPassword}
            disabled={isLoading}
          >
            <Text>{showPassword ? 'Скрыть' : 'Показать'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        {serverError ? (
          <Text style={styles.tvErrorTextPasswordAndServer}>{serverError}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.btnLogin, isLoading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnLoginText}>Кіру</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoApp: {
    width: 100,
    height: 100,
    marginTop: 60,
    alignSelf: 'center',
  },
  textSalem: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 24,
    color: COLORS.grey_900,
    marginTop: 24,
    marginStart: 24,
  },
  textAccLogin: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: COLORS.grey_500,
    marginTop: 4,
    marginStart: 24,
  },
  textEmail: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 14,
    color: COLORS.grey_900,
    marginTop: 24,
    marginStart: 24,
  },
  linearLayout: {
    marginHorizontal: 24,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editTextEmail: {
    flex: 1,
    paddingVertical: 16,
    paddingStart: 16,
    fontSize: 16,
    color: COLORS.grey_900,
  },
  tvErrorTextEmail: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.red,
    marginTop: 15,
  },
  textPassword: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 14,
    color: COLORS.grey_900,
    marginTop: 15,
    marginStart: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 5,
  },
  editTextPassword: {
    flex: 1,
    paddingVertical: 16,
    paddingStart: 16,
    fontSize: 16,
    color: COLORS.grey_900,
  },
  btnShowPassword: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.fui_transparent,
  },
  bottomContainer: {
    marginTop: 40,
    marginHorizontal: 24,
  },
  tvErrorTextPasswordAndServer: {
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 14,
    color: COLORS.red,
    marginTop: 15,
  },
  btnLogin: {
    height: 56,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  btnLoginText: {
    fontFamily: 'SF-Pro-Display-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
});