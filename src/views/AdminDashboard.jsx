'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteProject, fetchProjects, updateProjectStatus } from '../services/api';
import { errorMessage } from '../api/axios';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Badge, { StatusBadge } from '../components/common/Badge';
import Modal, { ConfirmModal } from '../components/common/Modal';
import EmptyState, { ErrorState } from '../components/common/EmptyState';
import { TextArea } from '../components/forms/Field';
import Spinner from '../components/common/Spinner';

const TABS = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'approved', label: 'Published' },
  { id: 'rejected', label: 'Needs changes' },
  { id: '', label: 'All' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value || 0);

const AdminDashboard = () => {
  const toast = useToast();

  const [tab, setTab] = useState('pending');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);

    fetchProjects({ status: tab || undefined, limit: 50, sort: 'newest' })
      .then((response) => {
        setProjects(response.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(errorMessage(err, 'Could not load the moderation queue.'));
        setLoading(false);
      });
  };

  useEffect(load, [tab]);

  const handleApprove = async (project) => {
    setBusyId(project.id);
    try {
      await updateProjectStatus(project.id, 'approved');
      toast.success(`"${project.title}" is now published.`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not approve this project.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectError('Please explain what needs to change. The teacher sees this message.');
      return;
    }

    setBusyId(rejecting.id);
    try {
      await updateProjectStatus(rejecting.id, 'rejected', rejectionReason.trim());
      toast.success('Feedback sent to the teacher.');
      setRejecting(null);
      setRejectionReason('');
      setRejectError('');
      load();
    } catch (err) {
      setRejectError(errorMessage(err, 'Could not save your decision.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    setBusyId(deleting.id);
    try {
      await deleteProject(deleting.id);
      toast.success('Project deleted.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this project.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Moderation</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Review submissions for clear instructions, realistic costs, and safety appropriate to a
          school without lab equipment. Rejections require a reason, which the teacher sees.
        </p>
      </header>

      <div className="scroll-x mb-6">
        <div className="flex min-w-max gap-2" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button
              key={t.id || 'all'}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-muted ring-1 ring-surface-line hover:bg-surface-sunken hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading queue" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="✅"
          title={tab === 'pending' ? 'Nothing waiting for review' : 'No projects here'}
          description={
            tab === 'pending'
              ? 'New submissions will appear here as teachers publish them.'
              : 'Try another tab.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-card border border-surface-line bg-white p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={project.status} />
                    <Badge tone="brand">{project.subject}</Badge>
                    <Badge>Class {project.classLevel}</Badge>
                    <Badge tone="info">{project.difficulty}</Badge>
                  </div>

                  <h2 className="text-lg font-semibold text-ink">
                    <Link href={`/project/${project.id}`} className="hover:underline">
                      {project.title}
                    </Link>
                  </h2>

                  {project.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{project.summary}</p>
                  )}

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-subtle">
                    <div className="flex gap-1">
                      <dt>Budget:</dt>
                      <dd className="font-medium text-ink-muted">{formatCurrency(project.budget)}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Materials:</dt>
                      <dd className="font-medium text-ink-muted">{project.materials?.length || 0}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Steps:</dt>
                      <dd className="font-medium text-ink-muted">{project.steps?.length || 0}</dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>Safety notes:</dt>
                      <dd className="font-medium text-ink-muted">
                        {project.safetyPrecautions?.length || 0}
                      </dd>
                    </div>
                    {project.creator?.name && (
                      <div className="flex gap-1">
                        <dt>By:</dt>
                        <dd className="font-medium text-ink-muted">{project.creator.name}</dd>
                      </div>
                    )}
                  </dl>

                  {project.status === 'rejected' && project.rejectionReason && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <span className="font-semibold">Your feedback: </span>
                      {project.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
                  <Button variant="secondary" size="sm" to={`/project/${project.id}`}>
                    Preview
                  </Button>
                  {project.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(project)}
                      loading={busyId === project.id}
                    >
                      Approve
                    </Button>
                  )}
                  {project.status !== 'rejected' && (
                    <Button variant="secondary" size="sm" onClick={() => setRejecting(project)}>
                      Request changes
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" to={`/project/${project.id}/edit`}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleting(project)}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => {
          setRejecting(null);
          setRejectionReason('');
          setRejectError('');
        }}
        title="Request changes"
        description={rejecting ? `"${rejecting.title}" will be sent back to its author.` : ''}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRejecting(null);
                setRejectionReason('');
                setRejectError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} loading={busyId === rejecting?.id}>
              Send feedback
            </Button>
          </>
        }
      >
        <TextArea
          label="What needs to change?"
          rows={4}
          value={rejectionReason}
          onChange={(e) => {
            setRejectionReason(e.target.value);
            setRejectError('');
          }}
          error={rejectError}
          required
          maxLength={1000}
          placeholder="e.g. Step 4 involves boiling water with no supervision note. Please add one, and give quantities for the vinegar."
          hint="The teacher sees this exactly as written. Be specific and actionable."
        />
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={busyId === deleting?.id}
        title={deleting ? `Delete "${deleting.title}"?` : ''}
        description="This permanently removes the guide and all its reviews. Requesting changes is usually the better option."
        confirmLabel="Delete permanently"
      />
    </div>
  );
};

export default AdminDashboard;
