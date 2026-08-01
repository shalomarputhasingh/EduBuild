import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/api';
import { errorMessage, fieldErrors } from '../api/axios';
import { useToast } from '../components/common/Toast';
import ProjectForm, { emptyProject } from '../components/forms/ProjectForm';
import { toPayload } from '../utils/projectPayload';

const SubmitProject = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setErrors({});

    try {
      const response = await createProject(toPayload(values));
      toast.success(response.message);
      navigate('/dashboard');
    } catch (error) {
      const fields = fieldErrors(error);
      if (fields) {
        setErrors(fields);
        toast.error('Some fields need attention. See the list at the top of the form.');
      } else {
        toast.error(errorMessage(error, 'Could not submit your project.'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page max-w-4xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Publish a project guide</h1>
        <p className="mt-2 text-ink-muted">
          Share an activity that worked in your classroom. Be specific about materials, costs and
          safety — that is what makes a guide usable by someone else.
        </p>
      </header>

      <ProjectForm
        initialValues={emptyProject}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Submit for review"
        errors={errors}
      />
    </div>
  );
};

export default SubmitProject;
