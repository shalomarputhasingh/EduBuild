'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import Button from '../common/Button';

const linkClass = (isActive) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-800'
      : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
  ].join(' ');

/**
 * Next has no NavLink, so active state is derived from the pathname.
 *
 * `exact` is needed for /admin: without it, /admin/ai-settings would light up
 * the Moderation tab as well as its own.
 */
const NavItem = ({ href, pathname, exact = false, children }) => {
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={linkClass(isActive)} aria-current={isActive ? 'page' : undefined}>
      {children}
    </Link>
  );
};

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="sr-only">
        Choose language
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-lg border border-surface-line bg-white px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand-300"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const NavBar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation, or it stays open over the new page.
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = (
    <>
      <NavItem href="/projects" pathname={pathname}>
        {translate('nav.library')}
      </NavItem>
      {isAuthenticated && (
        <>
          <NavItem href="/submit" pathname={pathname}>
            {translate('nav.publish')}
          </NavItem>
          <NavItem href="/assistant" pathname={pathname}>
            {translate('nav.assistant')}
          </NavItem>
          <NavItem href="/scanner" pathname={pathname}>
            {translate('nav.scanner')}
          </NavItem>
          {!isAdmin && (
            <NavItem href="/dashboard" pathname={pathname}>
              {translate('nav.submissions')}
            </NavItem>
          )}
          {isAdmin && (
            <>
              <NavItem href="/admin" pathname={pathname} exact>
                {translate('nav.moderation')}
              </NavItem>
              <NavItem href="/admin/ai-settings" pathname={pathname}>
                {translate('nav.aiSettings')}
              </NavItem>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-surface-line bg-white/85 backdrop-blur">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/"
            className="flex shrink-0 items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-ink"
          >
            {/* A slate, not a rounded app icon: the mark belongs to the same
                classroom as the rest of the palette. */}
            <span
              className="grid h-8 w-8 place-items-center rounded-md bg-board font-mono text-sm font-medium text-white"
              aria-hidden="true"
            >
              EB
            </span>
            EDUBUILD
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLinks}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSelector />
            {isAuthenticated ? (
              <>
                <span className="max-w-[12rem] truncate text-sm text-ink-muted">
                  {user?.name}
                  {isAdmin && <span className="ml-1 font-semibold text-brand-700">(admin)</span>}
                </span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  {translate('nav.signout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" to="/signin">
                  {translate('nav.signin')}
                </Button>
                <Button size="sm" to="/signup">
                  {translate('nav.signup')}
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="tap-target inline-flex items-center justify-center rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-sunken lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span aria-hidden="true" className="text-xl">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-surface-line bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Main">
            {navLinks}
            <div className="mt-3 flex flex-col gap-3 border-t border-surface-line pt-4">
              <LanguageSelector />
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-ink-muted">Signed in as {user?.name}</span>
                  <Button variant="secondary" onClick={handleLogout} fullWidth>
                    {translate('nav.signout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" to="/signin" fullWidth>
                    {translate('nav.signin')}
                  </Button>
                  <Button to="/signup" fullWidth>
                    {translate('nav.signup')}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;
