import React from 'react';
import Link from 'next/link';
import Badge, { StatusBadge } from '../common/Badge';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800';

const formatBudget = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value || 0);

/** "40 min" reads fine; "150 min" does not. Past an hour, use hours. */
const formatDuration = (minutes) => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}H ${rest}M` : `${hours}H`;
};

/**
 * A project in the library grid.
 *
 * The whole card is a link. The previous version opened the guide on
 * double-click on a plain div, which meant it could not be reached by keyboard,
 * announced by a screen reader, or opened in a new tab.
 *
 * The footer is the spec strip — cost and duration in the mono face, the two
 * facts a teacher checks before anything else. It is the same row, in the same
 * order, on the detail page.
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
  const duration = formatDuration(estimatedTimeMinutes);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-surface-line bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunken">
        <img
          src={image || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        {videoId && (
          <span className="absolute right-3 top-3 rounded-md bg-board/85 px-2 py-1 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
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

        <h3 className="break-anywhere font-display text-lg font-bold leading-snug tracking-tight text-ink">
          {/* Stretched link: the heading is the accessible name, the ::after
              covers the card so the whole surface is clickable. */}
          <Link href={`/project/${id}`}
            className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700"
          >
            {title}
          </Link>
        </h3>

        {blurb && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{blurb}</p>}

        {/* The spec strip. Cost first, because budget is the constraint that
            rules a guide in or out. The rating sits outside it — it is what
            other teachers thought, not a property of the build. */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-surface-line pt-3">
          <div className="spec text-ink-subtle">
            <span className="text-brand-700">{formatBudget(budget)}</span>
            {duration && <span>{duration}</span>}
          </div>

          {rating > 0 && (
            <span className="tabular inline-flex shrink-0 items-center gap-1 font-mono text-xs font-medium text-marigold-deep">
              <span aria-hidden="true" className="text-marigold">
                ★
              </span>
              {rating.toFixed(1)}
              <span className="sr-only"> out of 5</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
