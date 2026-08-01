import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import ProjectCard from '../components/project/ProjectCard';
import { ProjectGridSkeleton } from '../components/common/Skeleton';

const STEPS = [
  {
    title: 'Find an activity that fits',
    body: 'Filter by class level, subject, difficulty and budget. Every guide states what it costs and how long it takes before you open it.',
  },
  {
    title: 'Check the guide before the lesson',
    body: 'Materials with quantities and prices, numbered steps, safety notes where they apply, and a tutorial video when one exists.',
  },
  {
    title: 'Publish what works for you',
    body: 'Write up an activity that went well. A moderator reviews it for clarity and safety, then it joins the library for everyone.',
  },
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
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              For teachers, by teachers
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Classroom science that works on a real budget
            </h1>
            <p className="mt-5 text-lg text-ink-muted">
              Practical STEM project guides built from low-cost and recycled materials — with
              costed material lists, step-by-step instructions, safety notes and tutorial videos.
              Free to browse, and free to use in your classroom.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" to="/projects">
                Browse the library
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="secondary" to="/signup">
                  Create a free account
                </Button>
              )}
            </div>
            <p className="mt-4 text-sm text-ink-subtle">
              No account needed to browse. You only need one to publish a guide or leave feedback.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-card border border-slate-200 bg-white p-6 shadow-card"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 font-bold text-brand-800">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Highly rated guides</h2>
          <Link
            to="/projects"
            className="shrink-0 text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            See all
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
          <div className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-ink-muted">
              The library is empty right now.{' '}
              <Link to="/submit" className="font-semibold text-brand-700 hover:underline">
                Publish the first guide
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="container-page py-14">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight text-ink">Every guide is reviewed</h2>
            <p className="mt-3 text-ink-muted">
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
