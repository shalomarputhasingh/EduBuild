import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { TextInput } from '../components/forms/Field';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const sessionExpired = searchParams.get('expired') === '1';
  const redirectTo = location.state?.from?.pathname || '/projects';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFormError('');
    setErrors({});

    try {
      const { data } = await api.post('/auth/signin', form);
      login(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrors(fieldErrors(error) || {});
      setFormError(errorMessage(error, 'Could not sign you in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-card border border-slate-200 bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to publish guides, leave feedback and track your submissions.
          </p>

          {sessionExpired && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              Your session expired. Please sign in again.
            </p>
          )}

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <TextInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <TextInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
