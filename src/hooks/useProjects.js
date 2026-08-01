import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProjects } from '../services/api';
import { errorMessage } from '../api/axios';

/**
 * Library listing state: filters, pagination, and fetching.
 *
 * Filters live in the URL query string rather than component state, so a
 * filtered view is shareable, survives a refresh, and works with the browser's
 * back button.
 *
 * All filtering happens on the server. The previous implementation fetched
 * every project and filtered in the browser, which also meant a teacher's own
 * pending submissions were downloaded and then hidden by a client-side check.
 */

export const DEFAULT_FILTERS = {
  search: '',
  subject: '',
  classLevel: '',
  difficulty: '',
  material: '',
  tag: '',
  budgetMin: '',
  budgetMax: '',
  status: '',
  sort: 'newest',
  page: '1',
};

const SEARCH_DEBOUNCE_MS = 350;

export const useProjects = ({ pageSize = 12 } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState({ data: [], page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keeps typing responsive while the request is debounced behind it.
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');

  const abortRef = useRef(null);

  const filters = useMemo(() => {
    const current = {};
    for (const key of Object.keys(DEFAULT_FILTERS)) {
      current[key] = searchParams.get(key) ?? DEFAULT_FILTERS[key];
    }
    return current;
  }, [searchParams]);

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === '' || value == null || value === 'All') next.delete(key);
          else next.set(key, String(value));
          // Any filter change invalidates the current page number.
          if (key !== 'page') next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (page) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (page <= 1) next.delete('page');
          else next.set('page', String(page));
          return next;
        },
        { replace: false }
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Debounce only the text input; every other filter applies immediately.
  useEffect(() => {
    if (searchInput === filters.search) return undefined;
    const timer = setTimeout(() => setFilter('search', searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setFilter]);

  // Keep the input in step when the URL changes from elsewhere (back button,
  // a link from the scanner, "reset filters").
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    // Cancel the in-flight request so a slow earlier response cannot land after
    // a faster later one and overwrite it.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetchProjects({ ...filters, limit: pageSize }, { signal: controller.signal })
      .then((response) => {
        setResult(response);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || err.code === 'ERR_CANCELED') return;
        setError(errorMessage(err, 'Could not load projects.'));
        setLoading(false);
      });

    return () => controller.abort();
  }, [filters, pageSize]);

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) => !['page', 'sort'].includes(key) && value !== DEFAULT_FILTERS[key]
      ).length,
    [filters]
  );

  return {
    projects: result.data,
    page: result.page,
    totalPages: result.totalPages,
    total: result.total,
    loading,
    error,
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    setPage,
    resetFilters,
    activeFilterCount,
    refetch: () => setSearchParams((p) => new URLSearchParams(p), { replace: true }),
  };
};

export default useProjects;
