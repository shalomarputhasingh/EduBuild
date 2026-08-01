'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { errorMessage, fieldErrors } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { TextInput } from '../components/forms/Field';

/**
 * Every account is created as a plain `user`. There is no role selector and no
 * admin-secret field: the backend assigns the role and ignores anything the
 * client sends. Admin is granted by an operator running scripts/promoteAdmin.js.
 */
const SignUp = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    state: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...payload } = form;
      const { data } = await api.post('/auth/signup', payload);
      login(data);
      router.replace('/projects');
    } catch (error) {
      setErrors(fieldErrors(error) || {});
      setFormError(errorMessage(error, 'Could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-card border border-surface-line bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Publish your own project guides, leave feedback, and track your submissions. Browsing
            the library never requires an account.
          </p>

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
              label="Full name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                hint="At least 8 characters"
                required
              />
              <TextInput
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="School"
                name="school"
                value={form.school}
                onChange={handleChange}
                error={errors.school}
                hint="Optional"
              />
              <TextInput
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                error={errors.state}
                hint="Optional"
              />
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link href="/signin" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
