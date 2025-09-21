// types/index.ts
export interface University {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  // Alias for GoogleMapsView compatibility
  center: {
    latitude: number;
    longitude: number;
  };
  bounds?: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
  campusBoundary?: Array<{ latitude: number; longitude: number }>;
  coverageRadius?: number; // in kilometers
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'staff' | 'security' | 'admin';
  university?: University;
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
  university?: University;
}