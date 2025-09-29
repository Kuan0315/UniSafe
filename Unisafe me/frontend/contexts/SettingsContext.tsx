import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LangCode = 'en' | 'ms' | 'es' | 'fr' | 'de' | 'zh' | 'ar';

type ThemeMode = 'Light' | 'Dark';

interface SettingsContextType {
  language: LangCode;
  theme: ThemeMode;
  setLanguage: (lang: string) => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const TRANSLATIONS: Record<LangCode, Record<string, string>> = {
  en: {
    'Profile and Settings': 'Profile and Settings',
    'Select Language': 'Select Language',
    'Select Theme': 'Select Theme',
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Report Incidents': 'Report Incidents',
    'Recent Reports': 'Recent Reports',
    'Stay informed about campus safety': 'Stay informed about campus safety',
    'Report Incident': 'Report Incident',
    'Description *': 'Description *',
    'Location *': 'Location *',
    'Anonymous Report': 'Anonymous Report',
    'Your identity will be hidden from other users': 'Your identity will be hidden from other users',
    'Missing Information': 'Missing Information',
    'Please fill in all required fields.': 'Please fill in all required fields.',
    'Report Submitted': 'Report Submitted',
    'Your report has been submitted successfully. Campus security has been notified.': 'Your report has been submitted successfully. Campus security has been notified.',
  },
  ms: {
    'Profile and Settings': 'Profil dan Tetapan',
    'Select Language': 'Pilih Bahasa',
    'Select Theme': 'Pilih Tema',
    'Save': 'Simpan',
    'Cancel': 'Batal',
    'Report Incidents': 'Lapor Insiden',
    'Recent Reports': 'Laporan Terkini',
    'Stay informed about campus safety': 'Kekal maklum tentang keselamatan kampus',
    'Report Incident': 'Lapor Insiden',
    'Description *': 'Deskripsi *',
    'Location *': 'Lokasi *',
    'Anonymous Report': 'Laporan Tanpa Nama',
    'Your identity will be hidden from other users': 'Identiti anda akan disembunyikan daripada pengguna lain',
    'Missing Information': 'Maklumat Tidak Lengkap',
    'Please fill in all required fields.': 'Sila isi semua medan yang diperlukan.',
    'Report Submitted': 'Laporan Dihantar',
    'Your report has been submitted successfully. Campus security has been notified.': 'Laporan anda berjaya dihantar. Keselamatan kampus telah dimaklumkan.',
  },
  es: {}, fr: {}, de: {}, zh: {}, ar: {}
};

function normalizeLang(input: string | null | undefined): LangCode {
  const map: Record<string, LangCode> = {
    English: 'en', Malay: 'ms', Bahasa: 'ms', Spanish: 'es', French: 'fr', German: 'de', Chinese: 'zh', Arabic: 'ar',
    en: 'en', ms: 'ms', es: 'es', fr: 'fr', de: 'de', zh: 'zh', ar: 'ar'
  };
  return map[input || 'en'] || 'en';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LangCode>('en');
  const [theme, setThemeState] = useState<ThemeMode>('Light');

  useEffect(() => {
    (async () => {
      try {
        const [l, t] = await Promise.all([
          AsyncStorage.getItem('app_language'),
          AsyncStorage.getItem('app_theme'),
        ]);
        if (l) setLanguageState(normalizeLang(l));
        if (t === 'Light' || t === 'Dark') setThemeState(t);
      } catch {}
    })();
  }, []);

  const setLanguage = async (lang: string) => {
    const code = normalizeLang(lang);
    setLanguageState(code);
    try { await AsyncStorage.setItem('app_language', code); } catch {}
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try { await AsyncStorage.setItem('app_theme', mode); } catch {}
  };

  const t = (key: string) => {
    const table = TRANSLATIONS[language] || TRANSLATIONS.en;
    return table[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, theme, setLanguage, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}


