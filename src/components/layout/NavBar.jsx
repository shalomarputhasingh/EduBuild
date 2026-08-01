import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import Button from '../common/Button';

const linkClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
  ].join(' ');

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
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:border-slate-400"
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
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation, or it stays open over the new page.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = (
    <>
      <NavLink to="/projects" className={linkClass}>
        {translate('nav.library')}
      </NavLink>
      {isAuthenticated && (
        <>
          <NavLink to="/submit" className={linkClass}>
            {translate('nav.publish')}
          </NavLink>
          <NavLink to="/assistant" className={linkClass}>
            {translate('nav.assistant')}
          </NavLink>
          <NavLink to="/scanner" className={linkClass}>
            {translate('nav.scanner')}
          </NavLink>
          {!isAdmin && (
            <NavLink to="/dashboard" className={linkClass}>
              {translate('nav.submissions')}
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass}>
                {translate('nav.moderation')}
              </NavLink>
              <NavLink to="/admin/ai-settings" className={linkClass}>
                {translate('nav.aiSettings')}
              </NavLink>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-ink"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"
              aria-hidden="true"
            >
              E
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
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-slate-100 lg:hidden"
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
        <div id="mobile-menu" className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Main">
            {navLinks}
            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-4">
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
