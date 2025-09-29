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
                try {
                    const res = await (await import('../services/api')).Api.get('/auth/me');
                    const refreshed: User = { id: res.id, email: res.email, name: res.name, role: res.role, avatar: res.avatarDataUrl } as any;
                    setUser(refreshed);
                    await SecureStore.setItemAsync('userData', JSON.stringify(refreshed));
                } catch { }
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
            const res = await Api.post('/auth/login', credentials);
            const userFromApi: User = {
                id: res.id,
                email: res.email,
                name: res.name,
                role: res.role,
                avatar: res.avatarDataUrl,
                phone: res.phone,
                studentId: res.studentId,
            };
            setUser(userFromApi);
            await SecureStore.setItemAsync('userData', JSON.stringify(userFromApi));
            if (res.token) await SecureStore.setItemAsync('authToken', res.token);

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
            await SecureStore.deleteItemAsync('authToken');
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
            const res = await Api.post('/auth/signup', credentials);
            const userFromApi: User = {
                id: res.id,
                email: res.email,
                name: res.name,
                role: res.role,
                avatar: res.avatarDataUrl,
                phone: res.phone,
                studentId: res.studentId,
            };
            setUser(userFromApi);
            await SecureStore.setItemAsync('userData', JSON.stringify(userFromApi));
            if (res.token) await SecureStore.setItemAsync('authToken', res.token);

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