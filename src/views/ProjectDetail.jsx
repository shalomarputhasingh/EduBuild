'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { deleteProject, getProjectById, getRelatedProjects } from '../services/api';
import { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import Button from '../components/common/Button';
import Badge, { StatusBadge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/Modal';
import { ErrorState } from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import MaterialsChecklist from '../components/project/MaterialsChecklist';
import StepList from '../components/project/StepList';
import VideoEmbed from '../components/project/VideoEmbed';
import ProjectCard from '../components/project/ProjectCard';
import FeedbackSection from '../components/project/FeedbackSection';
import ProjectHelp from '../components/ai/ProjectHelp';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1200';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value || 0);

const Section = ({ id, title, children, className = '' }) => (
  <section id={id} className={`rounded-card border border-surface-line bg-white p-6 shadow-card ${className}`}>
    <h2 className="mb-4 text-lg font-bold tracking-tight text-ink">{title}</h2>
    {children}
  </section>
);

const ProjectDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    getProjectById(id)
      .then((data) => {
        setProject(data);
        setLoading(false);
        // Related projects are supplementary — a failure here must not blank
        // out the guide the teacher actually asked for.
        getRelatedProjects(id).then(setRelated).catch(() => setRelated([]));
      })
      .catch((err) => {
        setError(errorMessage(err, 'Could not load this project.'));
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success('Project deleted.');
      router.push('/projects');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this project.'));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  /**
   * jsPDF is ~350kB and is only needed the moment someone downloads. Importing
   * it dynamically keeps it out of every other page's bundle.
   */
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { default: JsPDF } = await import('jspdf');
      const doc = new JsPDF({ unit: 'pt', format: 'a4' });

      const margin = 48;
      const width = doc.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = margin;

      const ensureSpace = (needed) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const write = (text, { size = 11, style = 'normal', gap = 6 } = {}) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(String(text), width);
        ensureSpace(lines.length * (size + 3));
        doc.text(lines, margin, y);
        y += lines.length * (size + 3) + gap;
      };

      write(project.title, { size: 20, style: 'bold', gap: 10 });
      write(
        `${project.subject}  ·  Class ${project.classLevel}  ·  ${project.difficulty}  ·  ${formatCurrency(project.budget)}` +
          (project.estimatedTimeMinutes ? `  ·  ${project.estimatedTimeMinutes} min` : ''),
        { size: 10, gap: 14 }
      );

      if (project.summary) write(project.summary, { gap: 12 });
      if (project.concept) {
        write('Concept', { size: 13, style: 'bold' });
        write(project.concept, { gap: 12 });
      }

      write('Description', { size: 13, style: 'bold' });
      write(project.description, { gap: 14 });

      if (project.materials?.length) {
        write('Materials', { size: 13, style: 'bold' });
        project.materials.forEach((m) => {
          const parts = [m.name];
          if (m.quantity) parts.push(`(${m.quantity})`);
          if (typeof m.estimatedCost === 'number') parts.push(`- ${formatCurrency(m.estimatedCost)}`);
          write(`•  ${parts.join(' ')}`, { gap: 2 });
          if (m.alternative) write(`    Alternative: ${m.alternative}`, { size: 10, gap: 2 });
        });
        y += 10;
      }

      if (project.steps?.length) {
        write('Steps', { size: 13, style: 'bold' });
        project.steps.forEach((step, index) => {
          write(`${index + 1}. ${step.title ? `${step.title} — ` : ''}${step.description}`, { gap: 4 });
          if (step.safetyNote) write(`    Safety: ${step.safetyNote}`, { size: 10, gap: 6 });
        });
        y += 10;
      }

      if (project.safetyPrecautions?.length) {
        write('Safety precautions', { size: 13, style: 'bold' });
        project.safetyPrecautions.forEach((s) => write(`•  ${s}`, { gap: 2 }));
        y += 10;
      }

      if (project.learningOutcomes?.length) {
        write('Learning outcomes', { size: 13, style: 'bold' });
        project.learningOutcomes.forEach((o) => write(`•  ${o}`, { gap: 2 }));
      }

      if (project.videoUrl) {
        y += 10;
        write('Tutorial video', { size: 13, style: 'bold' });
        write(project.videoUrl, { size: 10 });
      }

      doc.save(`${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`);
    } catch (err) {
      toast.error('Could not generate the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading project" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Could not load this project" description={error} onRetry={load} />
        <div className="mt-6 text-center">
          <Button variant="secondary" to="/projects">
            Back to the library
          </Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isCreator = user && project.createdBy === user.id;
  const canEdit = isCreator || isAdmin;

  return (
    <div className="container-page py-8">
      <Link href="/projects"
        className="inline-block text-sm font-medium text-ink-muted hover:text-ink"
      >
        ← Back to the library
      </Link>

      {/* Hero */}
      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="brand">{project.subject}</Badge>
              <Badge>Class {project.classLevel}</Badge>
              <Badge tone="info">{project.difficulty}</Badge>
              {canEdit && project.status !== 'approved' && <StatusBadge status={project.status} />}
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl">
              {project.title}
            </h1>
            {project.summary && <p className="mt-3 max-w-3xl text-lg text-ink-muted">{project.summary}</p>}
            {project.creator?.name && (
              <p className="mt-3 text-sm text-ink-subtle">
                Published by {project.creator.name}
                {project.creator.school && ` · ${project.creator.school}`}
              </p>
            )}
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
            <Button variant="secondary" onClick={handleDownloadPdf} loading={downloading}>
              Download PDF
            </Button>
            {canEdit && (
              <>
                <Button variant="secondary" to={`/project/${project.id}/edit`}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {project.status === 'rejected' && canEdit && project.rejectionReason && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="font-semibold text-red-900">Changes requested by a moderator</h2>
            <p className="mt-1 text-sm text-red-800">{project.rejectionReason}</p>
            <Button variant="secondary" size="sm" className="mt-3" to={`/project/${project.id}/edit`}>
              Edit and resubmit
            </Button>
          </div>
        )}
      </header>

      {project.image && (
        <img
          src={project.image}
          alt=""
          className="mt-8 max-h-[420px] w-full rounded-card border border-surface-line object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      )}

      {/* The title block: the same four facts, in the same order, that the card
          in the library showed — set as one ruled panel rather than four
          floating cards, so it reads as a specification and not as stats. */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-surface-line bg-surface-line lg:grid-cols-4">
        {[
          { label: 'Estimated budget', value: formatCurrency(project.budget) },
          {
            label: 'Materials cost',
            value: project.materialsCost != null ? formatCurrency(project.materialsCost) : 'Not priced',
          },
          {
            label: 'Time needed',
            value: project.estimatedTimeMinutes ? `${project.estimatedTimeMinutes} min` : 'Not stated',
          },
          {
            label: 'Rating',
            value: project.rating > 0 ? `${project.rating.toFixed(1)} / 5` : 'No reviews yet',
          },
        ].map((fact) => (
          <div key={fact.label} className="bg-white px-4 py-4">
            <dt className="eyebrow text-ink-subtle">{fact.label}</dt>
            <dd className="tabular mt-1.5 font-mono text-lg font-medium text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section id="overview" title="Overview">
            <p className="prose-guide whitespace-pre-line">{project.description}</p>
            {project.concept && (
              <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-800">
                  Concept taught
                </h3>
                <p className="mt-1 text-ink">{project.concept}</p>
              </div>
            )}
            {project.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Link key={tag} href={`/projects?tag=${encodeURIComponent(tag)}`}>
                    <Badge>{tag}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section id="steps" title="Step-by-step guide">
            <StepList steps={project.steps} />
          </Section>

          {project.videoId && (
            <Section id="video" title="Tutorial video">
              <VideoEmbed {...project} />
            </Section>
          )}

          <ProjectHelp project={project} />

          <FeedbackSection projectId={project.id} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Section id="materials" title="Materials">
            <MaterialsChecklist materials={project.materials} projectId={project.id} />
          </Section>

          {project.safetyPrecautions?.length > 0 && (
            <section className="rounded-card border border-amber-200 bg-amber-50 p-6">
              <h2 className="mb-3 text-lg font-bold tracking-tight text-amber-900">
                Safety precautions
              </h2>
              <ul className="space-y-2">
                {project.safetyPrecautions.map((precaution, index) => (
                  <li key={index} className="flex gap-2 text-sm text-amber-900">
                    <span aria-hidden="true">•</span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {project.learningOutcomes?.length > 0 && (
            <Section id="outcomes" title="Learning outcomes">
              <ul className="space-y-2">
                {project.learningOutcomes.map((outcome, index) => (
                  <li key={index} className="flex gap-2 text-sm text-ink-muted">
                    <span className="text-brand-600" aria-hidden="true">
                      ✓
                    </span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold tracking-tight text-ink">Related guides</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </section>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${project.title}"?`}
        description="This permanently removes the guide and all its reviews. This cannot be undone."
        confirmLabel="Delete permanently"
      />
    </div>
  );
};

export default ProjectDetail;
