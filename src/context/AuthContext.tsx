import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  roles: string[];
  groupId: number;
  groupName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  setIsAuthenticated: (value: boolean) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await AsyncStorage.getItem('isAuthenticated');
        const storedUser = await AsyncStorage.getItem('user');
        setIsAuthenticatedState(auth === 'true');
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      }
    };
    checkAuth();
  }, []);

  const setIsAuthenticated = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('isAuthenticated', value.toString());
      setIsAuthenticatedState(value);
      if (!value) {
        // Clear user data on logout
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
    <AuthContext.Provider value={{ isAuthenticated, user, setIsAuthenticated, setUser }}>
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