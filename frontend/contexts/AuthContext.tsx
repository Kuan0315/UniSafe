// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, SignupCredentials } from '../types';



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
      // TODO: Replace with your actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the role from credentials, or determine from email for demo purposes
      let userRole: User['role'] = credentials.role || 'student';
      
      // For demo purposes, detect role from email if not provided
      if (!credentials.role) {
        if (credentials.email.includes('+security')) userRole = 'security';
        else if (credentials.email.includes('+staff')) userRole = 'staff';
        else if (credentials.email.includes('+admin')) userRole = 'admin';
      }
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: 'John Doe',
        role: userRole,
      };

      setUser(mockUser);
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
      
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
        university: credentials.university,
      };

      setUser(mockUser);
      await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));
      
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