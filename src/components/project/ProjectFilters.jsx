import React, { useState } from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Engineering'];
const CLASS_LEVELS = ['6-8', '9-10', '11-12'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-400';

/** Voice search, where the browser supports it. Feature-detected, never assumed. */
const useSpeechRecognition = (onResult, language) => {
  const [listening, setListening] = useState(false);
  const SpeechRecognition =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'tel' ? 'te-IN' : 'en-IN';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => onResult(event.results[0][0].transcript);
    recognition.start();
  };

  return { supported: Boolean(SpeechRecognition), listening, start };
};

const ProjectFilters = ({
  filters,
  searchInput,
  setSearchInput,
  setFilter,
  onReset,
  activeFilterCount,
  language = 'en',
}) => {
  const [expanded, setExpanded] = useState(false);
  const voice = useSpeechRecognition(setSearchInput, language);

  return (
    <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          >
            🔍
          </span>
          <input
            id="project-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, concept or material…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-20 text-sm transition-colors hover:border-slate-400"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-slate-100 hover:text-ink"
              >
                ✕
              </button>
            )}
            {voice.supported && (
              <button
                type="button"
                onClick={voice.start}
                aria-label={voice.listening ? 'Listening…' : 'Search by voice'}
                aria-pressed={voice.listening}
                className={`rounded-full p-1.5 transition-colors ${
                  voice.listening
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-subtle hover:bg-slate-100 hover:text-ink'
                }`}
              >
                🎤
              </button>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="filter-panel"
          className="shrink-0"
        >
          Filters
          {activeFilterCount > 0 && (
            <Badge tone="brand" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {expanded && (
        <div id="filter-panel" className="mt-4 border-t border-slate-200 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filter-subject" className="mb-1.5 block text-sm font-medium text-ink">
                Subject
              </label>
              <select
                id="filter-subject"
                value={filters.subject}
                onChange={(e) => setFilter('subject', e.target.value)}
                className={selectClass}
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-class" className="mb-1.5 block text-sm font-medium text-ink">
                Class level
              </label>
              <select
                id="filter-class"
                value={filters.classLevel}
                onChange={(e) => setFilter('classLevel', e.target.value)}
                className={selectClass}
              >
                <option value="">All levels</option>
                {CLASS_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-difficulty"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Difficulty
              </label>
              <select
                id="filter-difficulty"
                value={filters.difficulty}
                onChange={(e) => setFilter('difficulty', e.target.value)}
                className={selectClass}
              >
                <option value="">Any difficulty</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-material" className="mb-1.5 block text-sm font-medium text-ink">
                Material
              </label>
              <input
                id="filter-material"
                type="text"
                value={filters.material}
                onChange={(e) => setFilter('material', e.target.value)}
                placeholder="e.g. cardboard"
                className={selectClass}
              />
            </div>

            <div className="sm:col-span-2">
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-ink">Budget range (₹)</legend>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={filters.budgetMin}
                    onChange={(e) => setFilter('budgetMin', e.target.value)}
                    placeholder="Min"
                    aria-label="Minimum budget in rupees"
                    className={selectClass}
                  />
                  <span className="text-ink-subtle" aria-hidden="true">
                    –
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={filters.budgetMax}
                    onChange={(e) => setFilter('budgetMax', e.target.value)}
                    placeholder="Max"
                    aria-label="Maximum budget in rupees"
                    className={selectClass}
                  />
                </div>
              </fieldset>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-2">
              <Button variant="ghost" onClick={onReset} disabled={activeFilterCount === 0}>
                Clear all filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilters;
