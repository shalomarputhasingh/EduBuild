'use client';

import React from 'react';
import { AuthProvider } from '@/src/context/AuthContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ToastProvider } from '@/src/components/common/Toast';

/**
 * Every context in the app, in one client boundary.
 *
 * The root layout stays a server component; this is the single 'use client'
 * seam beneath it, so the providers are the only thing forced into the client
 * bundle rather than the whole tree above them.
 */
export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
