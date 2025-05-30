import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Интерфейс для роли (если это объект)
interface Role {
  name: string;
}

// Интерфейс для пользователя
interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  roles: (string | Role)[]; // Поддержка строк или объектов с name
  groupId: number;
  groupName: string;
  accessToken: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  setIsAuthenticated: (value: boolean) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const auth = await AsyncStorage.getItem('isAuthenticated');
        const storedUser = await AsyncStorage.getItem('user');

        if (auth === 'true') {
          setIsAuthenticatedState(true);
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Loaded user from AsyncStorage:', parsedUser);
          setUserState(parsedUser);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const setIsAuthenticated = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('isAuthenticated', value.toString());
      setIsAuthenticatedState(value);
      if (!value) {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('accessToken');
        setUserState(null);
      }
    } catch (error) {
      console.error('Error setting auth state:', error);
    }
  };

  const setUser = async (user: User | null) => {
    try {
      if (user) {
        console.log('Saving user to AsyncStorage:', user);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('user');
      }
      setUserState(user);
    } catch (error) {
      console.error('Error setting user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, setIsAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}