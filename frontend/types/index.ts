// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'staff' | 'security' | 'admin';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'student' | 'staff' | 'security' | 'admin';
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'staff' | 'security' | 'admin';
}