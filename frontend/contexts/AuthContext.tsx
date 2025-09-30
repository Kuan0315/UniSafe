// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, SignupCredentials } from '../types';
import { Api } from '../services/api';



interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  isSecurity: boolean; // convenience flag
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      Alert.alert('Error', 'Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await Api.post('/auth/login', credentials);
      
      // Store the token
      await SecureStore.setItemAsync('authToken', response.token);
      
      // Store user data
      const userData: User = {
        id: response.id,
        email: response.email,
        name: response.name,
        role: response.role,
        phone: response.phone,
        studentId: response.studentId,
      };
      setUser(userData);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setIsLoading(true);
    try {
      const response = await Api.post('/auth/signup', credentials);
      
      // Store the token
      await SecureStore.setItemAsync('authToken', response.token);
      
      // Store user data
      const userData: User = {
        id: response.id,
        email: response.email,
        name: response.name,
        role: response.role,
        phone: response.phone,
        studentId: response.studentId,
        university: credentials.university,
      };
      setUser(userData);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup, isSecurity: !!(user && (user.role === 'security' || user.role === 'admin')) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}