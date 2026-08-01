'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

const Waiting = ({ label }) => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner size="lg" label={label} />
  </div>
);

/**
 * Client-side access control, replacing the <RequireAuth> / <RequireAdmin>
 * wrapper routes from React Router.
 *
 * It waits for `ready` before deciding anything. Auth state is restored from
 * localStorage after mount, so acting on the first render would bounce every
 * signed-in user to /signin on a hard refresh.
 *
 * This is a UX guard, not a security boundary — every protected API route
 * re-checks the token server-side, which is what actually enforces access.
 */
const RouteGuard = ({ children, admin = false }) => {
  const { isAuthenticated, isAdmin, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = isAuthenticated && (!admin || isAdmin);

  useEffect(() => {
    if (!ready || allowed) return;

    if (!isAuthenticated) {
      // Remember where they were headed so sign-in can return them there.
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    } else {
      router.replace('/projects');
    }
  }, [ready, allowed, isAuthenticated, router, pathname]);

  if (!ready) return <Waiting label="Loading" />;
  if (!allowed) return <Waiting label="Redirecting" />;

  return children;
};

export default RouteGuard;
