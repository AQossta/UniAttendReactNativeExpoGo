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

interface Student {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  attend: boolean;
  attendanceDuration: number; // Добавлено поле для времени участия
}

interface AttendanceStats {
  scheduleDTO: ScheduleItem;
  totalCount: number;
  presentCount: number;
  statistic: number;
  message: string;
  studentDTO: Student[];
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

  // Парсинг данных расписания
  let scheduleItem: ScheduleItem | null = null;
  try {
    scheduleItem = scheduleData ? JSON.parse(scheduleData as string) : null;
  } catch (e) {
    console.error('Ошибка парсинга scheduleData:', e);
    setError('Неверные данные расписания');
    setLoading(false);
  }

  useEffect(() => {
    if (!scheduleItem || !accessToken) {
      setError('Отсутствуют данные пользователя или расписания');
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE}/api/v1/teacher/schedule/${scheduleItem.id}`,
          {
            headers: {
              'Auth-token': accessToken,
            },
          }
        );

        setStats(response.data.body);
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err);
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [scheduleItem?.id, accessToken]);

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

  if (!scheduleItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Отсутствуют данные расписания
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Статистика: {stats?.scheduleDTO.subject || 'Н/Д'}
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
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      ) : stats ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Информация о занятии
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Предмет: {stats.scheduleDTO.subject}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Время: {formatTime(stats.scheduleDTO.startTime, stats.scheduleDTO.endTime)}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Группа: {stats.scheduleDTO.groupName}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Преподаватель: {stats.scheduleDTO.teacherName}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Статистика посещаемости
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Всего студентов: {stats.totalCount}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Присутствовало: {stats.presentCount}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              Процент: {stats.statistic}%
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
                    Присутствовало: {attendancePercentage.attended}%
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: colors.notAttended }]}
                  />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    Отсутствовало: {attendancePercentage.notAttended}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Список студентов
            </Text>
            {stats.studentDTO.map((student) => (
              <View key={student.id} style={styles.studentItem}>
                <Text style={[styles.studentText, { color: colors.textPrimary }]}>
                  {student.name}
                </Text>
                <Text style={[styles.studentText, { color: colors.textSecondary }]}>
                  {student.email}
                </Text>
                <Text style={[styles.studentText, { color: colors.textSecondary }]}>
                  {student.phoneNumber}
                </Text>
                <Text
                  style={[
                    styles.studentText,
                    { color: student.attend ? colors.attended : colors.notAttended },
                  ]}
                >
                  {student.attend ? 'Присутствовал' : 'Отсутствовал'}
                </Text>
                {student.attend && (
                  <Text style={[styles.studentText, { color: colors.textSecondary }]}>
                    Время участия: {student.attendanceDuration} мин
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Статистика недоступна
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>Назад</Text>
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
  studentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  studentText: {
    fontSize: 14,
    marginBottom: 4,
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
  },
});