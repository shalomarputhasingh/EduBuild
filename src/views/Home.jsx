'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchProjects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import ProjectCard from '../components/project/ProjectCard';
import { ProjectGridSkeleton } from '../components/common/Skeleton';

const STEPS = [
  {
    label: 'Find',
    title: 'Find an activity that fits',
    body: 'Filter by class level, subject, difficulty and budget. Every guide states what it costs and how long it takes before you open it.',
  },
  {
    label: 'Check',
    title: 'Check the guide before the lesson',
    body: 'Materials with quantities and prices, numbered steps, safety notes where they apply, and a tutorial video when one exists.',
  },
  {
    label: 'Publish',
    title: 'Publish what works for you',
    body: 'Write up an activity that went well. A moderator reviews it for clarity and safety, then it joins the library for everyone.',
  },
];

/**
 * What the hero claims, stated as build parameters rather than as marketing
 * numbers. These are properties of the library itself, not counts that go stale.
 */
const HERO_SPECS = [
  { value: '₹0–200', label: 'Typical build cost' },
  { value: 'Class 6–12', label: 'Levels covered' },
  { value: 'Reviewed', label: 'Before publishing' },
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchProjects({ limit: 3, sort: 'rating_desc' })
      .then((response) => {
        if (!cancelled) {
          setFeatured(response.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        // A failed fetch here just means no featured strip. The rest of the
        // page is static and still useful, so this is not surfaced as an error.
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* The board. The one place the page raises its voice. */}
      <section className="chalkboard">
        <div className="container-page py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow animate-rise-in text-marigold">For teachers, by teachers</p>

            <h1
              className="animate-rise-in mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl"
              style={{ animationDelay: '80ms' }}
            >
              Classroom science that works on a{' '}
              <span className="chalk-underline">real budget</span>
            </h1>

            <p
              className="animate-rise-in mt-6 max-w-xl text-lg leading-relaxed text-white/75"
              style={{ animationDelay: '160ms' }}
            >
              Practical STEM project guides built from low-cost and recycled materials — with
              costed material lists, step-by-step instructions, safety notes and tutorial videos.
              Free to browse, and free to use in your classroom.
            </p>

            <div
              className="animate-rise-in mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Button size="lg" variant="chalk" to="/projects">
                Browse the library
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="chalk-outline" to="/signup">
                  Create a free account
                </Button>
              )}
            </div>

            <p
              className="animate-rise-in mt-4 text-sm text-white/55"
              style={{ animationDelay: '300ms' }}
            >
              No account needed to browse. You only need one to publish a guide or leave feedback.
            </p>
          </div>

          {/* The spec strip at hero scale: the library's own parameters, ruled
              off from the pitch above it the way a drawing's title block is. */}
          <dl
            className="animate-rise-in mt-14 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-card border border-board-line bg-board-line sm:grid-cols-3"
            style={{ animationDelay: '380ms' }}
          >
            {HERO_SPECS.map((item) => (
              <div key={item.label} className="bg-board px-5 py-4">
                <dt className="eyebrow text-white/50">{item.label}</dt>
                <dd className="tabular mt-1.5 font-mono text-xl font-medium text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Paper. The workbench grid runs under everything between the boards. */}
      <div className="workbench">
        <section className="container-page py-16 sm:py-20">
          <p className="eyebrow text-brand-700">How it works</p>
          <h2 className="mt-2 max-w-lg text-3xl font-bold tracking-tight text-ink">
            Three steps, and none of them cost anything
          </h2>

          {/* Numbered because this genuinely is a sequence — you find before you
              check, and you check before you publish. */}
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card flex flex-col p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-medium text-brand-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="eyebrow text-ink-subtle">{step.label}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container-page pb-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-brand-700">Highest rated</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                Guides teachers came back for
              </h2>
            </div>
            <Link href="/projects"
              className="shrink-0 font-mono text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              See all →
            </Link>
          </div>

          {loading ? (
            <ProjectGridSkeleton count={3} />
          ) : featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-surface-line bg-white p-10 text-center">
              <p className="text-ink-muted">
                The library is empty right now.{' '}
                <Link href="/submit" className="font-semibold text-brand-700 hover:underline">
                  Publish the first guide
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="border-y border-surface-line bg-white">
        <div className="container-page py-16">
          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-12">
            <div>
              <p className="eyebrow text-brand-700">Moderation</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                Every guide is reviewed
              </h2>
            </div>
            <p className="prose-guide">
              Submissions are checked by a moderator before they appear publicly — for clear
              instructions, realistic costs, and safety appropriate to a school setting without lab
              equipment. If something needs changing, you get a written reason and can resubmit.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
