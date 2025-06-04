import React, { useState, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../api/API';

const API_STUDENT_SCHEDULE_BY_ID = API_BASE+"api/v1/student/schedule/group/";
const API_TEACHER_SCHEDULE_BY_ID = API_BASE+"api/v1/teacher/schedule/lecturer/";

interface ScheduleItem {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  groupId: number;
  teacherId: number;
  teacherName: string;
  groupName: string;
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    cardBackground: colorScheme === 'light' ? '#2D3A56' : '#E6F0FA',
    cardGradientStart: colorScheme === 'light' ? '#3B4A6A' : '#D1E3FA',
    cardGradientEnd: colorScheme === 'light' ? '#2D3A56' : '#E6F0FA',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    error: '#EF4444',
    accent: colorScheme === 'light' ? '#0A84FF' : '#007AFF',
    shadow: colorScheme === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
  };

  const fetchSchedule = async () => {
    if (!user) {
      setError('Данные пользователя отсутствуют');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      const accessToken = user.accessToken || (await AsyncStorage.getItem('accessToken'));

      if (!accessToken) {
        throw new Error('Токен доступа отсутствует');
      }

      if (user.roles.includes('teacher')) {
        console.log(`Запрос расписания для преподавателя ${user.id}`);
        response = await axios.get(`${API_TEACHER_SCHEDULE_BY_ID}${user.id}`, {
          headers: { 'Auth-token': accessToken },
        });
      } else if (user.roles.includes('student')) {
        console.log(`Запрос расписания для группы ${user.groupId}`);
        response = await axios.get(`${API_STUDENT_SCHEDULE_BY_ID}${user.groupId}`, {
          headers: { 'Auth-token': accessToken },
        });
      } else {
        throw new Error(`Неизвестная роль пользователя: ${user.roles.join(', ')}`);
      }

      setSchedule(response.data.body || []);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Ошибка при загрузке расписания';
      setError(errorMessage);
      console.error('Ошибка:', errorMessage);
      if (e.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        await useAuth().setIsAuthenticated(false);
        router.replace('/(main)/login');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
  };

  const handleItemPress = (item: ScheduleItem) => {
    try {
      router.push({
        pathname: '/(operation)/qr-generate',
        params: { scheduleData: JSON.stringify(item) },
      });
    } catch (error) {
      console.error('Ошибка навигации:', error);
      setError('Не удалось перейти к экрану QR-кода');
    }
  };

  const handleStatsPress = (item: ScheduleItem) => {
    try {
      router.push({
        pathname: '/(operation)/stats',
        params: { scheduleData: JSON.stringify(item) }, 
      });
    } catch (error) {
      console.error('Ошибка навигации к статистике:', error);
      setError('Не удалось открыть статистику');
    }
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const format = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${format(start)}–${format(end)}`;
  };

  const renderItem = ({ item, index }: { item: ScheduleItem; index: number }) => (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.cardGradient}>
          <View style={styles.cardHeader}>
            <Text style={[styles.time, { color: colors.textPrimary }]}>
              {formatTime(item.startTime, item.endTime)}
            </Text>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => handleStatsPress(item)}
            >
              <Image
                source={require('../../assets/images/icon_stats.png')}
                style={[styles.statsIcon, { tintColor: colors.textPrimary }]} // Цвет иконки соответствует теме
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.subject, { color: colors.textPrimary }]}>
            {item.subject}
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.group, { color: colors.textSecondary }]}>
              Группа: {item.groupName}
            </Text>
            <Text style={[styles.teacher, { color: colors.textSecondary }]}>
              Преподаватель: {item.teacherName}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Бугинги САБАКТАР</Text>
      </View>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка расписания...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={fetchSchedule}
          >
            <Text style={styles.retryText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      ) : schedule.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Расписание отсутствует
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={fetchSchedule}
          >
            <Text style={styles.retryText}>Обновить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={schedule}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  list: {
    paddingBottom: 24,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
    backgroundColor: 'transparent',
    borderLeftWidth: 5,
    borderLeftColor: '#0A84FF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsIcon: {
    width: 24,
    height: 24,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.9,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  group: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  teacher: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  error: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  empty: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});