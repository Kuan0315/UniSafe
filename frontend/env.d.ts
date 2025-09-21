declare module '@env' {
  export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  export const EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
  export const BACKEND_URL: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
    BACKEND_URL: string;
  }
}