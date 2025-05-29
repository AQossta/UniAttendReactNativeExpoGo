import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';
import * as Progress from 'react-native-progress';
import axios from 'axios';
import { API_BASE } from '../api/API';

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

interface AttendanceStats {
  scheduleId: number;
  subject: string;
  totalCount: number;
  presentCount: number;
  statistic: number;
  message: string;
}

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { scheduleData } = useLocalSearchParams();
  const router = useRouter();
  const accessToken = user?.accessToken;
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Парсим данные расписания
  let item: ScheduleItem | null = null;
  try {
    item = scheduleData ? JSON.parse(scheduleData as string) : null;
  } catch (e) {
    console.error('Ошибка парсинга scheduleData:', e);
    setError('Некорректные данные расписания');
    setLoading(false);
  }

  useEffect(() => {
    const fetchStats = async () => {
      if (!item || !accessToken) {
        setError('Данные пользователя или расписания отсутствуют');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE}api/v1/teacher/schedule/${item.id}`,
          {
            headers: {
              'Auth-token': accessToken,
            },
          }
        );

        const { body } = response.data;
        setStats({
          scheduleId: item.id,
          subject: item.subject,
          totalCount: body.totalCount,
          presentCount: body.presentCount,
          statistic: body.statistic,
          message: body.message,
        });
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке статистики:', err);
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [item, accessToken]);

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const format = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${format(start)}–${format(end)}`;
  };

  const handleBackPress = () => {
    router.back();
  };

  const attendancePercentage = stats
    ? {
        attended: ((stats.presentCount / stats.totalCount) * 100).toFixed(1),
        notAttended: ((1 - stats.presentCount / stats.totalCount) * 100).toFixed(1),
      }
    : { attended: '0', notAttended: '0' };

  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    cardBackground: colorScheme === 'light' ? '#2D3A56' : '#E6F0FA',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    error: '#EF4444',
    accent: colorScheme === 'light' ? '#0A84FF' : '#007AFF',
    shadow: colorScheme === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    attended: '#10B981',
    notAttended: '#EF4444',
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка статистики...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Данные расписания отсутствуют
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Вернуться</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Статистика: {item.subject}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Вернуться</Text>
          </TouchableOpacity>
        </View>
      ) : stats ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Информация о занятии
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Предмет: {item.subject}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Время: {formatTime(item.startTime, item.endTime)}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Группа: {item.groupName}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Преподаватель: {item.teacherName}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Общая статистика
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Всего студентов: {stats.totalCount}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Присутствует: {stats.presentCount}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Статистика: {stats.statistic}%
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Сообщение: {stats.message}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Процент посещаемости
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.pieChartContainer}>
                <Progress.Circle
                  size={150}
                  progress={parseFloat(attendancePercentage.attended) / 100}
                  showsText={false}
                  color={colors.attended}
                  unfilledColor={colors.notAttended}
                  borderWidth={0}
                  thickness={10}
                  style={styles.pieChart}
                />
                <Text style={styles.pieChartText}>
                  {`${attendancePercentage.attended}%`}
                </Text>
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: colors.attended }]}
                  />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Присутствовали: {attendancePercentage.attended}%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: colors.notAttended }]}
                  />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Отсутствовали: {attendancePercentage.notAttended}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Статистика отсутствует
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Вернуться</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  pieChartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChart: {
    marginBottom: 16,
  },
  pieChartText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: '700',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  chartLegend: {
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    color: '#D1D5DB',
  },
});