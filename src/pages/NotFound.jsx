import React from 'react';
import Button from '../components/common/Button';

const NotFound = () => (
  <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Page not found</h1>
    <p className="mt-3 max-w-md text-ink-muted">
      That page does not exist, or the project may have been removed.
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button to="/projects">Browse the library</Button>
      <Button variant="secondary" to="/">
        Go home
      </Button>
    </div>
  </div>
);

export default NotFound;
