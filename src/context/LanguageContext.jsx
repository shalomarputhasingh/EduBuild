import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'tel', label: 'తెలుగు', short: 'TE' },
];

const STORAGE_KEY = 'edubuild.language';

export const LanguageProvider = ({ children }) => {
  // Persisted, so a teacher who reads Telugu is not reset to English on every
  // page load — which is what the previous useState('en') did.
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : 'en';
  });

  const setLanguage = useCallback((code) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  useEffect(() => {
    // Keep the document language accurate for screen readers and translation tools.
    document.documentElement.lang = language === 'tel' ? 'te' : language;
  }, [language]);

  const translate = useCallback(
    (key, fallback) => translations[language]?.[key] || translations.en?.[key] || fallback || key,
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, translate }),
    [language, setLanguage, translate]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export default LanguageProvider;
