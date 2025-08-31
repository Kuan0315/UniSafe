// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'staff';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'staff';
}