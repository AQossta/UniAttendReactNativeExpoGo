import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '../../src/hooks/useColorScheme';

interface ScheduleItem {
  time: string;
  subject: string;
  group: string;
  room: string;
  additionalInfo: string;
}

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();

  // Динамические цвета в зависимости от темы
  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    cardBackground: colorScheme === 'light' ? '#2D3A56' : '#E6F0FA',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
  };

  // Данные расписания (в реальном приложении можно получить через API)
  const schedule: ScheduleItem[] = [
    {
      time: '8:00–8:50',
      subject: 'Функ Анализ корпуны №2 [БИИТ]',
      group: 'Топ: АЖК-47 (1-топ)',
      room: 'Аудитория: B-Кабак, 608',
      additionalInfo: 'Главное здание, хүнчүстар',
    },
    {
      time: '9:00–9:50',
      subject: 'Функ Анализ корпуны №2 [БИИТ]',
      group: 'Топ: АЖК-47 (1-топ)',
      room: 'Аудитория: B-Кабак, 608',
      additionalInfo: 'Главное здание, хүнчүстар',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Заголовок */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        БУРЫЙ САБАКТАР
      </Text>

      {/* Список занятий */}
      {schedule.map((item, index) => (
        <View
          key={index}
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.time, { color: colors.textPrimary }]}>
            {item.time}
          </Text>
          <Text style={[styles.subject, { color: colors.textSecondary }]}>
            {item.subject}
          </Text>
          <Text style={[styles.group, { color: colors.textSecondary }]}>
            {item.group}
          </Text>
          <Text style={[styles.room, { color: colors.textSecondary }]}>
            {item.room}
          </Text>
          <Text style={[styles.additionalInfo, { color: colors.textSecondary }]}>
            {item.additionalInfo}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  group: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
  },
  room: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
  },
  additionalInfo: {
    fontSize: 14,
    fontWeight: '400',
  },
});