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
  role: 'student' | 'staff' | 'security' | 'admin' | 'guardian';
<<<<<<< HEAD
  phone: string;
  studentId: string;
  //university?: University;
=======
  university?: University;
>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'student' | 'staff' | 'security' | 'admin' | 'guardian';
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'staff' | 'security' | 'admin' | 'guardian';
<<<<<<< HEAD
  phone: string;
=======
  phone?: string;
>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
}