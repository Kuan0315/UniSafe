import * as SecureStore from 'expo-secure-store';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

function resolveDefaultBaseUrl(): string {
    // 1) Allow override via Expo env var
    const envUrl = (process as any)?.env?.EXPO_PUBLIC_API_BASE_URL || (global as any)?.EXPO_PUBLIC_API_BASE_URL;
    if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
        return envUrl.replace(/\/$/, '') + '/api';
    }
    // 2) In native dev, derive LAN IP from Metro bundler URL
    if (Platform.OS !== 'web' && __DEV__) {
        try {
            // scriptURL example: http://192.168.1.10:19000/index.bundle?platform=android&dev=true&hot=false
            const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
            if (scriptURL) {
                const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
                if (match && match[1]) {
                    const host = match[1];
                    return `http://${host}:4000/api`;
                }
            }
            // Fallbacks via Expo Constants
            const manifest: any = (Constants as any);
            const hostUri: string | undefined = manifest?.expoConfig?.hostUri || manifest?.manifest2?.extra?.expoGo?.developer?.host;
            const debuggerHost: string | undefined = manifest?.manifest?.debuggerHost;
            const hostCandidate = hostUri?.split(':')[0] || debuggerHost?.split(':')[0];
            if (hostCandidate) {
                return `http://${hostCandidate}:4000/api`;
            }
        } catch { }
    }
    // 3) Fallback to localhost (works on emulators and web)
    return 'http://localhost:4000/api';
}

const DEFAULT_BASE_URL = resolveDefaultBaseUrl();

export const Api = {
    baseUrl: DEFAULT_BASE_URL,
    setBaseUrl(url: string) {
        this.baseUrl = url.replace(/\/$/, '') + '/api';
    },
    async getToken(): Promise<string | null> {
        return SecureStore.getItemAsync('authToken');
    },
    async request(path: string, options: RequestInit = {}) {
        const token = await this.getToken();
        const headers: any = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const message = json?.error || res.statusText || 'Request failed';
            throw new Error(message);
        }
        return json;
    },
    get(path: string) {
        return this.request(path);
    },
    post(path: string, body?: any) {
        return this.request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    },
    del(path: string) {
        return this.request(path, { method: 'DELETE' });
    }
};

