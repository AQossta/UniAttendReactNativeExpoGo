import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../api/API';

const API_GROUPS = `${API_BASE}api/v1/teacher/group`;
const API_TEACHER_SUBJECTS = `${API_BASE}api/v1/teacher/subject`;
const API_JOURNAL = `${API_BASE}api/v1/teacher/journal`;

interface Subject {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

interface JournalEntry {
  id: number;
  userId: number;
  email: string;
  name: string;
  assessment: string;
  dateCreate: string;
}

interface JournalResponse {
  body: JournalEntry[];
  message: string;
}

interface Student {
  userId: number;
  name: string;
  email: string;
}

interface AssessmentMap {
  [userId: number]: { [date: string]: string };
}

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const { user, setIsAuthenticated } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [uniqueDates, setUniqueDates] = useState<string[]>([]);
  const [assessmentMap, setAssessmentMap] = useState<AssessmentMap>({});

  const colors = {
    background: colorScheme === 'light' ? '#F7F9FC' : '#1A1F36',
    cardBackground: colorScheme === 'light' ? '#FFFFFF' : '#2D3A56',
    textPrimary: colorScheme === 'light' ? '#111827' : '#FFFFFF',
    textSecondary: colorScheme === 'light' ? '#6B7280' : '#D1D5DB',
    accent: '#007AFF',
    border: colorScheme === 'light' ? '#E5E7EB' : '#4B5E8A',
    error: '#EF4444',
    success: '#10B981',
  };

  const fetchGroupsAndSubjects = async () => {
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

      const [groupsResponse, subjectsResponse] = await Promise.all([
        axios.get(API_GROUPS, { headers: { 'Auth-token': accessToken } }),
        axios.get(API_TEACHER_SUBJECTS, { headers: { 'Auth-token': accessToken } }),
      ]);

      setGroups(groupsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Ошибка при загрузке данных';
      setError(errorMessage);
      console.error('Ошибка:', errorMessage);
      if (e.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        await setIsAuthenticated(false);
        router.replace('/(main)/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJournal = async (groupId: number, subjectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = user?.accessToken || (await AsyncStorage.getItem('accessToken'));
      if (!accessToken) {
        throw new Error('Токен доступа отсутствует');
      }

      const response = await axios.get<JournalResponse>(`${API_JOURNAL}/${groupId}?subjectId=${subjectId}`, {
        headers: { 'Auth-token': accessToken },
      });
      const entries = response.data.body || [];
      setJournalEntries(entries);

      // Extract unique students and dates
      const studentsMap: { [userId: number]: Student } = {};
      const datesSet = new Set<string>();
      const assessments: AssessmentMap = {};

      entries.forEach((entry) => {
        const date = formatDate(entry.dateCreate);
        studentsMap[entry.userId] = { userId: entry.userId, name: entry.name, email: entry.email };
        datesSet.add(date);
        if (!assessments[entry.userId]) {
          assessments[entry.userId] = {};
        }
        assessments[entry.userId][date] = entry.assessment;
      });

      setStudents(Object.values(studentsMap));
      setUniqueDates([...datesSet].sort());
      setAssessmentMap(assessments);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Ошибка при загрузке журнала';
      setError(errorMessage);
      console.error('Ошибка:', errorMessage);
      if (e.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова');
        await setIsAuthenticated(false);
        router.replace('/(main)/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedGroup && selectedSubject) {
      fetchJournal(selectedGroup.id, selectedSubject.id);
    }
  }, [selectedGroup, selectedSubject]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[
        styles.groupButton,
        {
          backgroundColor: selectedGroup?.id === item.id ? colors.accent : colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        setSelectedGroup(item);
        setSelectedSubject(null);
        setJournalEntries([]);
        setStudents([]);
        setUniqueDates([]);
        setAssessmentMap({});
      }}
    >
      <Text style={[styles.groupButtonText, { color: selectedGroup?.id === item.id ? '#FFFFFF' : colors.textPrimary }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[styles.modalItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => {
        setSelectedSubject(item);
        setShowSubjectModal(false);
      }}
    >
      <Text style={[styles.modalItemText, { color: colors.textPrimary }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderStudentRow = ({ item }: { item: Student }) => (
    <View style={[styles.tableRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.tableCell, styles.studentCell, { color: colors.textPrimary }]}>{item.name}</Text>
      {uniqueDates.map((date) => (
        <Text
          key={`${item.userId}-${date}`}
          style={[styles.tableCell, styles.assessmentCell, { color: colors.textSecondary }]}
        >
          {assessmentMap[item.userId]?.[date] || '-'}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Журнал</Text>

        {isLoading && !journalEntries.length ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Загрузка данных...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Выберите группу</Text>
              <FlatList
                data={groups}
                renderItem={renderGroupItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.groupList}
              />
            </View>

            {selectedGroup && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Выберите предмет</Text>
                <TouchableOpacity
                  style={[styles.subjectButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => setShowSubjectModal(true)}
                >
                  <Text style={[styles.subjectButtonText, { color: selectedSubject ? colors.textPrimary : colors.textSecondary }]}>
                    {selectedSubject ? selectedSubject.name : 'Выберите предмет'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedGroup && selectedSubject && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Журнал группы: {selectedGroup.name} ({selectedSubject.name})
                </Text>
                {students.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableContainer}>
                    <View>
                      <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.accent + '22', borderColor: colors.border }]}>
                        <Text style={[styles.tableCell, styles.studentCell, styles.headerCell, { color: colors.textPrimary }]}>ФИО</Text>
                        {uniqueDates.map((date) => (
                          <Text
                            key={date}
                            style={[styles.tableCell, styles.dateCell, styles.headerCell, { color: colors.textPrimary }]}
                          >
                            {date}
                          </Text>
                        ))}
                      </View>
                      <FlatList
                        data={students}
                        renderItem={renderStudentRow}
                        keyExtractor={(item) => item.userId.toString()}
                        style={styles.journalList}
                      />
                    </View>
                  </ScrollView>
                ) : (
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>Записи в журнале отсутствуют</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Выберите предмет</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupList: {
    maxHeight: 60,
  },
  groupButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subjectButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tableContainer: {
    maxWidth: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: '#007AFF22',
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 8,
    textAlign: 'center',
    minWidth: 80,
  },
  studentCell: {
    minWidth: 200,
    textAlign: 'left',
    fontWeight: '500',
  },
  dateCell: {
    minWidth: 100,
  },
  assessmentCell: {
    fontSize: 13,
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 15,
  },
  journalList: {
    flexGrow: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
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
    marginTop: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 20,
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