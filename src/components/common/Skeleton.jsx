import React from 'react';

/**
 * Loading placeholder shaped like the content it replaces, so the layout does
 * not jump when data arrives.
 */
export const Skeleton = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded bg-surface-line ${className}`} aria-hidden="true">
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="overflow-hidden rounded-card border border-surface-line bg-white shadow-card">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="space-y-3 p-5">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const ProjectGridSkeleton = ({ count = 6 }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
