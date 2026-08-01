import React from 'react';
import { Link } from 'react-router-dom';
import Badge, { StatusBadge } from '../common/Badge';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800';

const formatBudget = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value || 0);

/**
 * A project in the library grid.
 *
 * The whole card is a link. The previous version opened the guide on
 * double-click on a plain div, which meant it could not be reached by keyboard,
 * announced by a screen reader, or opened in a new tab.
 */
const ProjectCard = ({ project, showStatus = false }) => {
  const {
    id,
    title,
    summary,
    description,
    image,
    subject,
    classLevel,
    difficulty,
    budget,
    rating,
    estimatedTimeMinutes,
    status,
    videoId,
  } = project;

  const blurb = summary || description || '';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={image || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        {videoId && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">
            Video
          </span>
        )}
        {showStatus && status && (
          <span className="absolute left-3 top-3">
            <StatusBadge status={status} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge tone="brand">{subject}</Badge>
          <Badge>Class {classLevel}</Badge>
          {difficulty && <Badge tone="info">{difficulty}</Badge>}
        </div>

        <h3 className="break-anywhere text-base font-semibold leading-snug text-ink">
          {/* Stretched link: the heading is the accessible name, the ::after
              covers the card so the whole surface is clickable. */}
          <Link to={`/project/${id}`} className="after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>

        {blurb && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{blurb}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-sm">
          <span className="font-semibold text-brand-700">{formatBudget(budget)}</span>
          {estimatedTimeMinutes ? (
            <span className="text-ink-subtle">{estimatedTimeMinutes} min</span>
          ) : null}
          {rating > 0 && (
            <span className="ml-auto text-ink-subtle">
              <span aria-hidden="true">★</span> {rating.toFixed(1)}
              <span className="sr-only"> out of 5</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
