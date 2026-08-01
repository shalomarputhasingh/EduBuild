'use client';

import React, { useEffect, useState } from 'react';
import { fetchProjects, getRecommendedProjects } from '../services/api';
import { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/project/ProjectCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState, { ErrorState } from '../components/common/EmptyState';
import { ProjectGridSkeleton } from '../components/common/Skeleton';

const TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Awaiting review' },
  { id: 'approved', label: 'Published' },
  { id: 'rejected', label: 'Needs changes' },
];

const Dashboard = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);

    // The backend already scopes a non-admin's listing to their own projects
    // plus everything published, so filter to just this teacher's here.
    fetchProjects({ limit: 50, status: tab || undefined })
      .then((response) => {
        setProjects((response.data || []).filter((p) => p.createdBy === user?.id));
        setLoading(false);
      })
      .catch((err) => {
        setError(errorMessage(err, 'Could not load your submissions.'));
        setLoading(false);
      });
  };

  useEffect(load, [tab, user?.id]);

  useEffect(() => {
    getRecommendedProjects({ limit: 3 }).then(setRecommended).catch(() => setRecommended([]));
  }, []);

  const counts = projects.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {});

  return (
    <div className="container-page py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">My submissions</h1>
          <p className="mt-2 text-ink-muted">
            Signed in as {user?.name}. Track the review status of guides you have published.
          </p>
        </div>
        <Button to="/submit" className="shrink-0">
          Publish a guide
        </Button>
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
              {t.id && counts[t.id] > 0 && (
                <Badge tone={tab === t.id ? 'neutral' : 'brand'} className="ml-2">
                  {counts[t.id]}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <ProjectGridSkeleton count={3} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📄"
          title={tab ? 'Nothing in this category' : 'You have not published a guide yet'}
          description={
            tab
              ? 'Try another status tab.'
              : 'Share an activity that worked well in your classroom — it takes about ten minutes.'
          }
          action={!tab && <Button to="/submit">Publish your first guide</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id}>
              <ProjectCard project={project} showStatus />
              {project.status === 'rejected' && project.rejectionReason && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-900">
                    Changes requested
                  </p>
                  <p className="mt-1 text-sm text-red-800">{project.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-bold tracking-tight text-ink">Suggested for you</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
