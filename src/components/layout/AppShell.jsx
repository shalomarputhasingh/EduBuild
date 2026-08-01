import React from 'react';
import NavBar from './NavBar';

const Footer = () => (
  <footer className="mt-20 border-t border-slate-200 bg-white">
    <div className="container-page py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-extrabold tracking-tight text-ink">EDUBUILD</p>
          <p className="mt-2 text-sm text-ink-muted">
            Practical, low-cost STEM project guides for the classroom — written and reviewed by
            teachers.
          </p>
        </div>
        <div className="text-sm text-ink-muted">
          <p className="font-semibold text-ink">Safety</p>
          <p className="mt-2 max-w-xs">
            Guides here are written for supervised classroom use. Always review an activity and its
            safety notes before running it with students.
          </p>
        </div>
      </div>
      <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-ink-subtle">
        &copy; {new Date().getFullYear()} EDUBUILD
      </p>
    </div>
  </footer>
);

/**
 * Page frame: skip link, navigation, main landmark, footer.
 *
 * The skip link and the `id="main"` target are what let a keyboard user get
 * past the navigation on every page without tabbing through it.
 */
const AppShell = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <a href="#main" className="skip-link">
      Skip to main content
    </a>
    <NavBar />
    <main id="main" className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

export default AppShell;
