import React from 'react';
import NavBar from './NavBar';

/**
 * The board again, closing the page the way the hero opens it. The safety note
 * lives here rather than in a modal because it applies to every guide on the
 * site and should be readable without being dismissed.
 */
const Footer = () => (
  <footer className="chalkboard mt-20">
    <div className="container-page py-14">
      <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
        <div className="max-w-sm">
          <p className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-white">
            <span
              className="grid h-8 w-8 place-items-center rounded-md border border-white/25 font-mono text-sm font-medium"
              aria-hidden="true"
            >
              EB
            </span>
            EDUBUILD
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Practical, low-cost STEM project guides for the classroom — written and reviewed by
            teachers.
          </p>
        </div>
        <div className="sm:justify-self-end sm:text-right">
          <p className="eyebrow text-marigold">Safety</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70 sm:ml-auto">
            Guides here are written for supervised classroom use. Always review an activity and its
            safety notes before running it with students.
          </p>
        </div>
      </div>
      <p className="mt-12 border-t border-board-line pt-6 font-mono text-xs text-white/60">
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
