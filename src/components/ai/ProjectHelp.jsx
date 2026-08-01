'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getProjectHelp } from '../../services/api';
import { errorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const LANGUAGE_NAMES = { en: 'english', hi: 'hindi', tel: 'telugu' };

/**
 * On-demand teaching notes for a specific guide.
 *
 * Deliberately behind a button rather than generated on page load: each call
 * costs money against the server's provider key, and most visitors are reading
 * the guide rather than asking for help with it.
 */
const ProjectHelp = ({ project }) => {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getProjectHelp({
        title: project.title,
        description: project.description || '',
        concept: project.concept || undefined,
        materials: (project.materials || []).map((m) => m.name),
        language: LANGUAGE_NAMES[language] || 'english',
      });
      setExplanation(response.explanation);
    } catch (err) {
      setError(errorMessage(err, 'The assistant could not answer right now.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <section className="rounded-card border border-brand-200 bg-brand-50 p-6">
      <h2 className="text-lg font-bold tracking-tight text-ink">Teaching notes</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Ask the assistant how to run this activity — the concept, where it usually goes wrong, and
        questions to ask while students build.
      </p>

      {!explanation && !loading && (
        <Button className="mt-4" onClick={handleAsk}>
          Get teaching notes
        </Button>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-3">
          <Spinner label="Generating teaching notes" />
          <span className="text-sm text-ink-muted">Thinking…</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-white p-4">
          <p className="text-sm text-red-800">{error}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleAsk}>
            Try again
          </Button>
        </div>
      )}

      {explanation && (
        <div className="mt-4 rounded-lg border border-surface-line bg-white p-5">
          <p className="prose-guide whitespace-pre-line text-ink">{explanation}</p>
          <div className="mt-4 flex items-center gap-3 border-t border-surface-line pt-4">
            <Button variant="ghost" size="sm" onClick={() => setExplanation('')}>
              Close
            </Button>
            <Link href="/assistant" className="text-sm font-semibold text-brand-700 hover:underline">
              Ask a follow-up in the assistant
            </Link>
          </div>
          <p className="mt-3 text-xs text-ink-subtle">
            AI-generated. Check the steps and safety advice before using this with a class.
          </p>
        </div>
      )}
    </section>
  );
};

export default ProjectHelp;
