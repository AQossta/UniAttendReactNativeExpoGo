import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { Colors } from '../../src/constants/Colors';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../api/API';

export default function QRScanScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();
  const accessToken = user?.accessToken;
  const userId = user?.id;

  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [type, setType] = useState<'back' | 'front'>('back');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [showConfirmation, setShowConfirmation] = useState(false); // Для экрана подтверждения
  const [selectedScanType, setSelectedScanType] = useState<'IN' | 'OUT' | null>(null); // Тип сканирования

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (!locationPermission?.granted) {
      requestLocationPermission();
    }
  }, [permission, requestPermission, locationPermission, requestLocationPermission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanLineAnim]);

  const handleBack = () => {
    router.back();
  };

  const scanAttendance = useCallback(
    async (scheduleId: string, scanType: 'IN' | 'OUT') => {
      if (!accessToken || !userId) {
        setErrorMessage('Требуется авторизация');
        setScannedData(null);
        setShowConfirmation(false);
        return;
      }

      if (!locationPermission?.granted) {
        setErrorMessage('Требуется разрешение на доступ к геолокации');
        setScannedData(null);
        setShowConfirmation(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = location.coords;

        const response = await axios.post(
          `${API_BASE}api/v1/student/attendance/scan`,
          {
            userId,
            scheduleId: parseInt(scheduleId, 10),
            scanType,
            latitude,
            longitude,
          },
          {
            headers: {
              'Auth-token': accessToken,
            },
            timeout: 5000,
          }
        );

        setErrorMessage(response.data.message || 'Посещение отмечено успешно');
        setScannedData(null);
        setShowConfirmation(false);
        setSelectedScanType(null);
        setTimeout(() => setErrorMessage(null), 3000);
      } catch (error: any) {
        console.error('Ошибка при сканировании посещения:', error);
        const errorMsg = error.response?.data?.message || 'Ошибка при сканировании';
        setErrorMessage(errorMsg);
        setScannedData(null);
        setShowConfirmation(false);
        setSelectedScanType(null);
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, userId, locationPermission]
  );

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      const currentTime = Date.now();
      if (currentTime - lastScanTime < 2000) {
        return;
      }

      setLastScanTime(currentTime);

      const scheduleId = data.trim();
      if (!/^\d+$/.test(scheduleId)) {
        setErrorMessage('Недопустимый формат QR-кода');
        setScannedData(null);
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      setScannedData(scheduleId);
      setShowConfirmation(true); // Показываем экран подтверждения
    },
    [lastScanTime]
  );

  const handleConfirmScan = (scanType: 'IN' | 'OUT') => {
    if (scannedData) {
      setSelectedScanType(scanType);
      scanAttendance(scannedData, scanType);
    }
  };

  const handleCancelConfirmation = () => {
    setScannedData(null);
    setShowConfirmation(false);
    setSelectedScanType(null);
  };

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    toolbarBackground: colorScheme === 'light' ? '#2D3A56' : '#F3F4F6',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    accent: Colors[colorScheme ?? 'light'].tint || '#007AFF',
    scanFrame: '#FFFFFF',
    scanLine: colorScheme === 'light' ? '#0A84FF' : '#007AFF',
    error: colorScheme === 'light' ? '#FF6B6B' : '#EF4444',
    success: colorScheme === 'light' ? '#4ADE80' : '#10B981',
  };

  if (!permission || !locationPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Запрашиваются разрешения...
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Нет доступа к камере. Пожалуйста, разрешите доступ в настройках.
        </Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={styles.toggleButtonText}>Предоставить разрешение</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!locationPermission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Нет доступа к геолокации. Пожалуйста, разрешите доступ в настройках.
        </Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.accent }]}
          onPress={requestLocationPermission}
        >
          <Text style={styles.toggleButtonText}>Предоставить разрешение</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showConfirmation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.toolbar, { backgroundColor: colors.toolbarBackground }]}>
          <TouchableOpacity onPress={handleCancelConfirmation}>
            <Text style={[styles.toolbarText, { color: colors.textPrimary }]}>Отмена</Text>
          </TouchableOpacity>
          <Text style={[styles.toolbarTitle, { color: colors.textPrimary }]}>
            Подтверждение
          </Text>
          <View style={styles.toolbarSpacer} />
        </View>

        <View style={styles.confirmationContainer}>
          <Text style={[styles.confirmationText, { color: colors.textPrimary }]}>
            Выберите тип сканирования для занятия #{scannedData}
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.accent }]}
              onPress={() => handleConfirmScan('IN')}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>Приход (IN)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.accent }]}
              onPress={() => handleConfirmScan('OUT')}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>Уход (OUT)</Text>
            </TouchableOpacity>
          </View>
          {loading && (
            <ActivityIndicator size="large" color={colors.textPrimary} style={styles.loader} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { backgroundColor: colors.toolbarBackground }]}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.toolbarText, { color: colors.textPrimary }]}>Назад</Text>
        </TouchableOpacity>
        <Text style={[styles.toolbarTitle, { color: colors.textPrimary }]}>Сканер QR-кода</Text>
        <View style={styles.toolbarSpacer} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={type}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={loading || scannedData ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanFrame}>
                <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 260],
                          }),
                        },
                      ],
                      backgroundColor: colors.scanLine,
                    },
                  ]}
                />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </CameraView>
      </View>

      <View style={styles.feedbackContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.textPrimary} style={styles.loader} />
        ) : errorMessage ? (
          <Text
            style={[
              styles.feedbackText,
              {
                color: errorMessage.includes('успешно') ? colors.success : colors.error,
                backgroundColor: errorMessage.includes('успешно')
                  ? 'rgba(74, 222, 128, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              },
            ]}
          >
            {errorMessage}
          </Text>
        ) : (
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            Отсканируйте QR-код для отметки посещения
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.accent }]}
          onPress={toggleCameraType}
          disabled={loading}
        >
          <Text style={styles.toggleButtonText}>
            Переключить на {type === 'back' ? 'Фронтальную' : 'Заднюю'} камеру
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Вернуться</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  toolbarSpacer: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    aspectRatio: 1,
    alignSelf: 'center',
    width: '90%',
    maxHeight: 400,
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTop: {
    flex: 1,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 300,
  },
  overlaySide: {
    flex: 1,
  },
  scanFrame: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  frameCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
  scanLine: {
    height: 3,
    width: '100%',
  },
  overlayBottom: {
    flex: 1,
  },
  feedbackContainer: {
    marginTop: 32,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 32,
    marginHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  toggleButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 28,
  },
  loader: {
    marginVertical: 20,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmationText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});