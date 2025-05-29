import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../src/hooks/useColorScheme';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../api/API';

const API_TEACHER_SUBJECTS = API_BASE+"api/v1/teacher/subject";
const API_CREATE_SCHEDULE = API_BASE+"api/v1/teacher/schedule/create";
const API_GROUPS = API_BASE+"api/v1/teacher/group"; 

interface Subject {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

interface ScheduleResponse {
  body: string;
  message: string;
}

export default function CreateScheduleScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const colors = {
    background: colorScheme === 'light' ? '#1F2A44' : '#FFFFFF',
    cardBackground: colorScheme === 'light' ? '#2D3A56' : '#E6F0FA',
    textPrimary: colorScheme === 'light' ? '#FFFFFF' : '#111827',
    textSecondary: colorScheme === 'light' ? '#D1D5DB' : '#6B7280',
    accent: colorScheme === 'light' ? '#0A84FF' : '#007AFF',
    error: '#EF4444',
    success: '#10B981',
    inputBackground: colorScheme === 'light' ? '#3B4A6A' : '#F3F4F6',
    modalBackground: colorScheme === 'light' ? '#2D3A56' : '#FFFFFF',
  };

  const fetchSubjectsAndGroups = async () => {
    if (!user) {
      setError('Данные пользователя отсутствуют');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = user.accessToken || (await AsyncStorage.getItem('accessToken'));
      if (!accessToken) {
        throw new Error('Токен доступа отсутствует');
      }

      const subjectsResponse = await axios.get(API_TEACHER_SUBJECTS, {
        headers: { 'Auth-token': accessToken },
      });
      setSubjects(subjectsResponse.data || []);

      const groupsResponse = await axios.get(API_GROUPS, {
        headers: { 'Auth-token': accessToken },
      });
      setGroups(groupsResponse.data || []);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Ошибка при загрузке данных';
      setError(errorMessage);
      console.error('Ошибка:', errorMessage);
      if (e.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        await useAuth().setIsAuthenticated(false);
        router.replace('/(main)/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectsAndGroups();
  }, [user]);

  const handleCreateSchedule = async () => {
    if (!user || !selectedSubject || !selectedGroup || !startTime || !endTime) {
      setError('Заполните все поля');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = user.accessToken || (await AsyncStorage.getItem('accessToken'));
      if (!accessToken) {
        throw new Error('Токен доступа отсутствует');
      }

      const payload = {
        subjectId: selectedSubject.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        groupId: selectedGroup.id,
        lecturerId: user.id,
      };

      const response = await axios.post<ScheduleResponse>(API_CREATE_SCHEDULE, payload, {
        headers: { 'Auth-token': accessToken },
      });

      setSuccess(response.data.message || 'Расписание успешно создано');
      setTimeout(() => {
        setSuccess(null);
        router.back();
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Ошибка при создании расписания';
      setError(errorMessage);
      console.error('Ошибка:', errorMessage);
      if (e.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        await useAuth().setIsAuthenticated(false);
        router.replace('/(main)/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[styles.modalItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => {
        setSelectedSubject(item);
        setShowSubjectModal(false);
      }}
    >
      <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.modalItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => {
        setSelectedGroup(item);
        setShowGroupModal(false);
      }}
    >
      <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Создать расписание
        </Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Загрузка данных...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Выбор предмета */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Предмет
              </Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text style={[styles.inputText, { color: colors.textPrimary }]}>
                  {selectedSubject ? selectedSubject.name : 'Выберите предмет'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Выбор группы */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Группа
              </Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                onPress={() => setShowGroupModal(true)}
              >
                <Text style={[styles.inputText, { color: colors.textPrimary }]}>
                  {selectedGroup ? selectedGroup.name : 'Выберите группу'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Время начала */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Время начала
              </Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={[styles.inputText, { color: colors.textPrimary }]}>
                  {formatDateTime(startTime)}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) setStartTime(selectedDate);
                  }}
                />
              )}
            </View>

            {/* Время окончания */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Время окончания
              </Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.inputText, { color: colors.textPrimary }]}>
                  {formatDateTime(endTime)}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) setEndTime(selectedDate);
                  }}
                />
              )}
            </View>

            {/* Кнопка создания */}
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateSchedule}
              disabled={isLoading}
            >
              <Text style={styles.createButtonText}>Создать</Text>
            </TouchableOpacity>

            {success && (
              <View style={styles.successContainer}>
                <Text style={[styles.success, { color: colors.success }]}>
                  {success}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Модальное окно для выбора предмета */}
      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Выберите предмет
            </Text>
            <FlatList
              data={subjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.modalList}
            />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowSubjectModal(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальное окно для выбора группы */}
      <Modal
        visible={showGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Выберите группу
            </Text>
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.modalList}
            />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowGroupModal(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '400',
  },
  createButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
  },
  error: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  successContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  success: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});