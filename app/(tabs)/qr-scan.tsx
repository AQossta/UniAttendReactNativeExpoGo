import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { Colors } from '../../src/constants/Colors';

export default function QRScanScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Разрешение на использование камеры
  const [permission, requestPermission] = useCameraPermissions();
  // Тип камеры (задняя/фронтальная)
  const [type, setType] = useState<'back' | 'front'>('back');
  // Данные отсканированного QR-кода
  const [scannedData, setScannedData] = useState<string | null>(null);
  // Анимация для сканирующей линии
  const [scanLineAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Запрашиваем разрешение, если оно ещё не получено
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // Анимация сканирующей линии
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

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setScannedData(data);
    Alert.alert('QR Code Scanned', `Data: ${data}`, [
      { text: 'OK', onPress: () => setScannedData(null) },
    ]);
  };

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Динамические цвета в зависимости от темы
  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    toolbarBackground: colorScheme === 'light' ? '#2D3A56' : '#F3F4F6',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    accent: Colors[colorScheme ?? 'light'].tint || '#007AFF',
    scanFrame: '#FFFFFF',
    scanLine: colorScheme === 'light' ? '#0A84FF' : '#007AFF',
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          No access to camera. Please allow camera access in settings.
        </Text>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={styles.toggleButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          QR-code Scanner
        </Text>
        <View style={styles.toolbarSpacer} />
      </View>

      {/* Камера */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={type}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
        >
          {/* Затемнение вокруг рамки */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanFrame}>
                {/* Углы рамки */}
                <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
                <View
                  style={[styles.frameCorner, styles.frameCornerTopRight]}
                />
                <View
                  style={[styles.frameCorner, styles.frameCornerBottomLeft]}
                />
                <View
                  style={[styles.frameCorner, styles.frameCornerBottomRight]}
                />
                {/* Анимированная линия */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
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

      {/* Инструкция */}
      <Text style={[styles.instruction, { color: colors.textSecondary }]}>
        Scan a QR code to proceed
      </Text>

      {/* Кнопка переключения камеры */}
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: colors.accent }]}
        onPress={toggleCameraType}
      >
        <Text style={styles.toggleButtonText}>
          Switch to {type === 'back' ? 'Front' : 'Back'} Camera
        </Text>
      </TouchableOpacity>
    </View>
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
  toolbarSpacer: {
    width: 40, // Для симметрии
  },
  cameraContainer: {
    flex: 1,
    aspectRatio: 1,
    alignSelf: 'center',
    width: '100%',
    maxHeight: 300,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
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
    height: 240,
  },
  overlaySide: {
    flex: 1,
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
  },
  frameCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    height: 2,
    width: '100%',
  },
  overlayBottom: {
    flex: 1,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 24,
  },
  toggleButton: {
    marginTop: 24,
    marginHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 32,
  },
});