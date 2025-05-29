// Базовый URL API
const API_BASE = 'http://192.168.1.6:8080/';
// const API_BASE = 'http://localhost:8080/'
// Префиксы для ролей
const API_PATH_STUDENT = 'api/v1/student/';
const API_PATH_TEACHER = 'api/v1/teacher/';
const API_PATH_AUTH = 'api/v1/auth/';
const API_PATH_PASSWORD = 'api/v1/password/';

// Аутентификация (Auth)
const API_AUTH_SIGN_UP = API_BASE + API_PATH_AUTH + 'sign-up'; // POST: Регистрация пользователя
const API_AUTH_SIGN_IN = API_BASE + API_PATH_AUTH + 'sign-in'; // POST: Вход пользователя
const API_AUTH_LOGOUT = API_BASE + API_PATH_AUTH + 'logout'; // POST: Выход пользователя (требуется параметр token)

// Сброс пароля
const API_PASSWORD_EDIT_USER = `${API_BASE}${API_PATH_PASSWORD}editUser`; // PUT: Изменение пароля пользователя

// Студент (Student)
const API_STUDENT_ATTENDANCE_SCAN = `${API_BASE}${API_PATH_STUDENT}attendance/scan`; // POST: Сканирование QR-кода для отметки посещаемости
const API_STUDENT_SCHEDULE_BY_ID = API_BASE + API_PATH_STUDENT + 'schedule/'; // GET: Получение расписания по ID (добавить scheduleId в путь)
const API_STUDENT_SCHEDULE_BY_GROUP = API_BASE + API_PATH_STUDENT + 'schedule/group/'; // GET: Получение расписания по ID группы (добавить groupId в путь)

// Преподаватель (Teacher)
// Предметы (Subject)
const API_TEACHER_SUBJECT = `${API_BASE}${API_PATH_TEACHER}subject`; // GET: Получение списка предметов, POST: Добавление предмета, DELETE: Удаление предмета (требуется параметр id для DELETE)

// Группы (Group)
const API_TEACHER_GROUP = `${API_BASE}${API_PATH_TEACHER}group`; // GET: Получение списка групп, POST: Добавление группы (требуется параметр name), DELETE: Удаление группы (требуется параметр id)

// Расписание (Schedule)
const API_TEACHER_SCHEDULE_CREATE = `${API_BASE}${API_PATH_TEACHER}schedule/create`; // POST: Создание расписания
const API_TEACHER_SCHEDULE_BY_ID = API_BASE + API_PATH_TEACHER + 'schedule/'; // GET: Получение статистики по ID расписания (добавить scheduleId в путь)
const API_TEACHER_SCHEDULE_BY_LECTURER = `${API_BASE}${API_PATH_TEACHER}schedule/lecturer/`; // GET: Получение расписания по ID преподавателя (добавить lecturerId в путь)

// QR-коды
const API_TEACHER_QR_GENERATE = `${API_BASE}${API_PATH_TEACHER}qr/generate`; // POST: Генерация QR-кода (требуется параметр scheduleId)
const API_TEACHER_QR_GET = `${API_BASE}${API_PATH_TEACHER}qr/get`; // GET: Получение QR-кода (требуется параметр scheduleId)

// Экспорт всех путей
export {
  API_BASE,
  API_PATH_STUDENT,
  API_PATH_TEACHER,
  API_PATH_AUTH,
  API_PATH_PASSWORD,
  API_AUTH_SIGN_UP,
  API_AUTH_SIGN_IN,
  API_AUTH_LOGOUT,
  API_PASSWORD_EDIT_USER,
  API_STUDENT_ATTENDANCE_SCAN,
  API_STUDENT_SCHEDULE_BY_ID,
  API_STUDENT_SCHEDULE_BY_GROUP,
  API_TEACHER_SUBJECT,
  API_TEACHER_GROUP,
  API_TEACHER_SCHEDULE_CREATE,
  API_TEACHER_SCHEDULE_BY_ID,
  API_TEACHER_SCHEDULE_BY_LECTURER,
  API_TEACHER_QR_GENERATE,
  API_TEACHER_QR_GET,
};