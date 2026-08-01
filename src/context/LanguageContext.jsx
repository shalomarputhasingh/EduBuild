'use client';

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
  /**
   * Starts at English and adopts the stored choice after mount.
   *
   * Reading localStorage in the initialiser ran on the server during
   * prerendering, where it does not exist. Even behind a `typeof window` guard
   * it would be wrong: the server would render English, the client would render
   * Telugu, and the two would not match on hydration. Restoring in an effect
   * keeps the first paint identical on both sides.
   */
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((l) => l.code === stored)) setLanguageState(stored);
  }, []);

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
