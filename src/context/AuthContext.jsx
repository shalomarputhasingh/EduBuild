'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupted entry — treat as signed out rather than crashing on boot.
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  /**
   * State starts empty and is filled in after mount.
   *
   * Reading localStorage in the initialiser worked under Vite, where the app
   * only ever rendered in a browser. Next pre-renders this on the server, where
   * localStorage does not exist — and even guarded, seeding from storage would
   * make the server and client render different markup and trip a hydration
   * mismatch. `ready` lets consumers tell "signed out" apart from "not yet
   * known", so a page does not flash its signed-out state on every load.
   */
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setToken(localStorage.getItem('token'));
    setReady(true);
  }, []);

  const login = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Signing out in one tab signs out the others. Without this, a second tab
  // keeps rendering a signed-in UI backed by a token that no longer exists.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'token' && !event.newValue) {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      logout,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
    }),
    [user, token, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
