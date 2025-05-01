import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

export default function QrGenerateScreen() {
  const { scheduleData } = useLocalSearchParams();
  const router = useRouter();
  const schedule = scheduleData ? JSON.parse(scheduleData as string) : null;
  const { user } = useAuth();
  const accessToken = user?.accessToken;

  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isRunning, setIsRunning] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateQRCode = async () => {
    if (!schedule || !accessToken) {
      setError('Недостаточно данных для генерации QR-кода');
      setLoading(false);
      return;
    }

    try {
      console.log('Отправка запроса на генерацию QR-кода:', new Date().toISOString());
      const response = await axios.post(
        `http://192.168.0.103:8080/api/v1/teacher/qr/generate/${schedule.id}`,
        {},
        {
          headers: {
            'Auth-token': accessToken,
          },
        }
      );

      setQrCodeData(response.data.body.qrCode);
      setError(null);
    } catch (err) {
      console.error('Ошибка генерации QR-кода:', err);
      setError('Не удалось сгенерировать QR-код');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    generateQRCode();

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generateQRCode();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStop = () => {
    setIsRunning(false);
    setSecondsRemaining(10);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const format = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${format(start)}–${format(end)}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ flex: 1, justifyContent: 'center' }} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateQRCode}>
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <Text style={styles.title}>QR-код для занятия</Text>
            <Text style={styles.label}>Предмет: {schedule.subject}</Text>
            <Text style={styles.label}>Время: {formatTime(schedule.startTime, schedule.endTime)}</Text>
            <Text style={styles.label}>Группа: {schedule.groupName}</Text>
            <Text style={styles.label}>Преподаватель: {schedule.teacherName}</Text>
            <Text style={styles.timer}>Осталось до обновления: {secondsRemaining} сек</Text>
            <View style={styles.qrContainer}>
              {qrCodeData && (
                <QRCode
                  value={qrCodeData}
                  size={220}
                  color="#111827"
                  backgroundColor="transparent"
                />
              )}
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.stopButton, !isRunning && styles.disabledButton]}
                onPress={handleStop}
                disabled={!isRunning}
              >
                <Text style={styles.buttonText}>Остановить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resumeButton, isRunning && styles.disabledButton]}
                onPress={handleResume}
                disabled={isRunning}
              >
                <Text style={styles.buttonText}>Возобновить</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Вернуться</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginVertical: 6,
    color: '#6B7280',
  },
  timer: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginVertical: 16,
    textAlign: 'center',
  },
  qrContainer: {
    marginVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  stopButton: {
    padding: 14,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  resumeButton: {
    padding: 14,
    backgroundColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});