'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/project/ProjectCard';
import ProjectFilters from '../components/project/ProjectFilters';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import EmptyState, { ErrorState } from '../components/common/EmptyState';
import { ProjectGridSkeleton } from '../components/common/Skeleton';

const ProjectList = () => {
  const { isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const {
    projects,
    page,
    totalPages,
    total,
    loading,
    error,
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    setPage,
    resetFilters,
    activeFilterCount,
    refetch,
  } = useProjects({ pageSize: 12 });

  return (
    <div className="container-page py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-700">Library</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {translate('library.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted">{translate('library.subtitle')}</p>
        </div>
        {isAuthenticated && (
          <Button to="/submit" className="shrink-0">
            Publish a guide
          </Button>
        )}
      </header>

      <ProjectFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setFilter={setFilter}
        onReset={resetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Wraps: at 375px the count and the sort control together overflow a
          single row, and a nowrap flex row would push the page sideways. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {loading
            ? 'Searching…'
            : `${total} ${total === 1 ? 'guide' : 'guides'} found`}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-ink-muted">
            Sort
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            className="rounded-lg border border-surface-line bg-white px-3 py-1.5 text-sm transition-colors hover:border-brand-300"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="budget_asc">Lowest cost</option>
            <option value="budget_desc">Highest cost</option>
            <option value="rating_desc">Highest rated</option>
            <option value="title_asc">Title A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : loading ? (
          <ProjectGridSkeleton count={6} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No guides match those filters"
            description={
              activeFilterCount > 0
                ? 'Try widening the budget range or clearing a filter.'
                : 'The library has no published guides yet.'
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear all filters
                </Button>
              ) : (
                isAuthenticated && <Button to="/submit">Publish the first guide</Button>
              )
            }
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} showStatus />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-10" />
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
