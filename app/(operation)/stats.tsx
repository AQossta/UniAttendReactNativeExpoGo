import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
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

interface StudentAttendance {
  id: number;
  name: string;
  attended: boolean;
}

interface AttendanceStats {
  scheduleId: number;
  subject: string;
  students: StudentAttendance[];
}

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { scheduleData } = useLocalSearchParams();
  const router = useRouter();
  const accessToken = user?.accessToken;
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Парсим данные расписания
  let item: ScheduleItem | null = null;
  try {
    item = scheduleData ? JSON.parse(scheduleData as string) : null;
  } catch (e) {
    console.error('Ошибка парсинга scheduleData:', e);
    setError('Некорректные данные расписания');
  }

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

  // Загрузка данных с сервера
  useEffect(() => {
    const fetchStats = async () => {
      if (!item || !accessToken) {
        setError('Данные пользователя или расписания отсутствуют');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}api/v1/teacher/schedule/${item.id}`, {
          headers: {
            'Auth-token': accessToken,
          },
        });

        const { body } = response.data;
        const scheduleDTO = body.scheduleDTO;

        // Предполагаем, что список студентов и их посещаемость нужно получать отдельно
        // Для простоты здесь имитируем данные студентов на основе примера
        // В реальном случае это может быть отдельный эндпоинт
        const mockStudents: StudentAttendance[] = [
          { id: 1, name: 'John Doe', attended: Math.random() > 0.5 },
          { id: 2, name: 'Jane Smith', attended: Math.random() > 0.5 },
          { id: 3, name: 'Alice Johnson', attended: Math.random() > 0.5 },
          { id: 4, name: 'Bob Wilson', attended: Math.random() > 0.5 },
          { id: 5, name: 'Emma Brown', attended: Math.random() > 0.5 },
        ];

        setStats({
          scheduleId: scheduleDTO.id,
          subject: scheduleDTO.subject,
          students: mockStudents,
        });
        setError(null);
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err);
        setError('Не удалось загрузить статистику');
      }
    };

    fetchStats();
  }, [item, accessToken]);

  // Рассчитываем проценты посещения
  const attendancePercentage = stats?.students
    ? {
        attended: (
          (stats.students.filter((s) => s.attended).length / stats.students.length) * 100
        ).toFixed(1),
        notAttended: (
          (stats.students.filter((s) => !s.attended).length / stats.students.length) * 100
        ).toFixed(1),
      }
    : { attended: '0', notAttended: '0' };

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

  const renderStudent = ({ item }: { item: StudentAttendance }) => (
    <View style={[styles.studentRow, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.studentName, { color: colors.textPrimary }]}>
        {item.name}
      </Text>
      <Text
        style={[
          styles.attendanceStatus,
          { color: item.attended ? colors.attended : colors.notAttended },
        ]}
      >
        {item.attended ? '✔' : '✘'}
      </Text>
    </View>
  );

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
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
              Посещаемость студентов
            </Text>
            <FlatList
              data={stats.students}
              renderItem={renderStudent}
              keyExtractor={(student) => student.id.toString()}
              style={styles.studentList}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Процент посещаемости
            </Text>
            <View style={styles.chartContainer}>
              <Progress.Circle
                size={150}
                progress={parseFloat(attendancePercentage.attended) / 100} // Доля присутствующих
                showsText={true}
                color={colors.attended}
                unfilledColor={colors.notAttended}
                borderWidth={0}
                thickness={10}
                style={styles.pieChart}
              />
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
            Статистика загружается...
          </Text>
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
  studentList: {
    marginTop: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  attendanceStatus: {
    fontSize: 20,
    fontWeight: '700',
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
  pieChart: {
    marginBottom: 16,
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
});