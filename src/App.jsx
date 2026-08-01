import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import AppShell from './components/layout/AppShell';
import Spinner from './components/common/Spinner';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import NotFound from './pages/NotFound';

// Heavy or rarely-visited routes are split out of the initial bundle.
const SubmitProject = lazy(() => import('./pages/SubmitProject'));
const EditProject = lazy(() => import('./pages/EditProject'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AiSettings = lazy(() => import('./pages/AiSettings'));
const Assistant = lazy(() => import('./pages/Assistant'));
const MaterialScanner = lazy(() => import('./pages/MaterialScanner'));

const RouteLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner size="lg" label="Loading page" />
  </div>
);

/** Requires a signed-in account. Remembers where the user was headed. */
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return children;
};

const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<RouteLoader />}>
    <Routes>
      {/* Public. The library is browsable without an account — that is the
          point of a shared teaching resource, and gating it behind signup
          was the single biggest barrier in the previous version. */}
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<ProjectList />} />
      <Route path="/project/:id" element={<ProjectDetail />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Signed in */}
      <Route
        path="/submit"
        element={
          <RequireAuth>
            <SubmitProject />
          </RequireAuth>
        }
      />
      <Route
        path="/project/:id/edit"
        element={
          <RequireAuth>
            <EditProject />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/assistant"
        element={
          <RequireAuth>
            <Assistant />
          </RequireAuth>
        }
      />
      <Route
        path="/scanner"
        element={
          <RequireAuth>
            <MaterialScanner />
          </RequireAuth>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/ai-settings"
        element={
          <RequireAdmin>
            <AiSettings />
          </RequireAdmin>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
