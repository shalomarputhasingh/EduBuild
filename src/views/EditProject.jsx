'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProjectById, updateProject } from '../services/api';
import { errorMessage, fieldErrors } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import ProjectForm from '../components/forms/ProjectForm';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { ErrorState } from '../components/common/EmptyState';
import { toFormValues, toPayload } from '../utils/projectPayload';

const EditProject = () => {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, isAdmin } = useAuth();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getProjectById(id)
      .then((project) => {
        const isCreator = user && project.createdBy === user.id;
        if (!isCreator && !isAdmin) {
          toast.error('You can only edit your own projects.');
          router.replace(`/project/${id}`);
          return;
        }
        setInitialValues(toFormValues(project));
        setLoading(false);
      })
      .catch((error) => {
        setLoadError(errorMessage(error, 'Could not load this project.'));
        setLoading(false);
      });
  }, [id, user, isAdmin, navigate, toast]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setErrors({});

    try {
      const response = await updateProject(id, toPayload(values));
      toast.success(response.message);
      router.push(`/project/${id}`);
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields) {
        setErrors(fields);
        toast.error('Some fields need attention. See the list at the top of the form.');
      } else {
        toast.error(errorMessage(error, 'Could not save your changes.'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading project" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-page py-16">
        <ErrorState description={loadError} />
        <div className="mt-6 text-center">
          <Button variant="secondary" to="/projects">
            Back to the library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Edit project guide</h1>
        <p className="mt-2 text-ink-muted">
          {isAdmin
            ? 'As a moderator, your edits are published immediately without re-review.'
            : 'Saving changes sends this guide back to a moderator for review before it is published again.'}
        </p>
      </header>

      <ProjectForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
        errors={errors}
      />
    </div>
  );
};

export default EditProject;
