import { Suspense } from 'react';
import ProjectList from '@/src/views/ProjectList';
import Spinner from '@/src/components/common/Spinner';

export const metadata = {
  title: 'Project library — EDUBUILD',
  description: 'Browse low-cost, classroom-ready STEM project guides by subject, class level and budget.',
};

/**
 * The Suspense boundary is required, not decorative: ProjectList reads the
 * filter state from useSearchParams, and Next refuses to prerender a page that
 * reads search params without one.
 */
export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" label="Loading the library" />
        </div>
      }
    >
      <ProjectList />
    </Suspense>
  );
}
