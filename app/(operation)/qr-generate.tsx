import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';
import { API_BASE } from '../api/API';

// Base64 данные из Python для тестирования
const PYTHON_QR_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQAAAACoxAthAAABlUlEQVR4Xu3ZO1LDMBRGYTEUlF6Cl6Kl4aVlKVkCpQsmwveXbDmQEO4wklOc08QPfanu+JGE5C58P/A4iDeIN4g3iDeIN4g3iDeIN4g3iLd/kEuoxUsYUvoMY0rz7jAE0p8MZWsO0T6m13QO687SGZKDqH5k0rxq1Ud416rZxnpJHgI5ktRVEMjTEJvkpVFXWwjkUJIT+et9PwexD0gLUosa60JqEEhv4gjiDeJtTzS86yTrN6XwZsfXV6YSZAvSmJQL7Gjbp5CJinZkKmcUREF6kTrJYf+b0mAL7kwyBNKQWLrA5s3y8m5eZ25NsgWBqEbE5lUnbK1dYBd/dSZsXw6B9CJX6QJb7vvhxR5H9Z96CfIzSBui+34pbmeX+76IWo9BFKQL0UOnVkXtlOE92eo7kwxRkKZksrOZqLFOcn1QhUAOIuUtad35/S0JAulDbCfZ4+i2kx5NMgTSiOTmPLwbse3tTd6CKEjZaktqURdYu9Xbjmb89n0fAmlLHEG8QbxBvEG8QbxBvEG8QbxBvEG8PS35AlG5OsRaRz1QAAAAAElFTkSuQmCC';

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
        `${API_BASE}api/v1/teacher/qr/generate/${schedule.id}`,
        {},
        {
          headers: {
            'Auth-token': accessToken,
          },
        }
      );

      const serverData = response.data.body.qrCode;
      setQrCodeData(serverData.startsWith('data:image') ? serverData : `data:image/png;base64,${serverData}`);
      setError(null);
    } catch (err) {
      console.error('Ошибка генерации QR-кода:', err);
      setQrCodeData(`data:image/png;base64,${PYTHON_QR_BASE64}`); // Тестовые данные
      setError('Не удалось сгенерировать QR-код с сервера, используется тестовый QR');
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
                <Image
                  source={{ uri: qrCodeData }}
                  style={{ width: 420, height: 420 }}
                  resizeMode="contain"
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
};

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