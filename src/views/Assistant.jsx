'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithAI } from '../services/api';
import { errorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';

const LANGUAGE_NAMES = { en: 'english', hi: 'hindi', tel: 'telugu' };

const SUGGESTIONS = [
  'A 40-minute Class 8 activity on air pressure, under ₹100',
  'Why does my baking soda volcano fizz out in two seconds?',
  'Safe alternatives to an open flame for a heat-transfer demo',
  'Cheap ways to demonstrate refraction without a glass prism',
];

const TypingDots = () => (
  <span className="flex gap-1" aria-label="Assistant is typing">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 animate-bounce rounded-full bg-brand-600"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

const Assistant = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput('');
    setError('');
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, { role: 'user', text: message }]);
    setLoading(true);

    try {
      const response = await chatWithAI({
        message,
        history,
        language: LANGUAGE_NAMES[language] || 'english',
      });
      setMessages((current) => [...current, { role: 'assistant', text: response.reply }]);
    } catch (err) {
      setError(errorMessage(err, 'The assistant could not respond.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Teaching assistant</h1>
        <p className="mt-2 text-ink-muted">
          Plan an activity, work out why a demonstration is not behaving, or adapt something to a
          different class level and budget.
        </p>
      </header>

      <div className="flex min-h-[26rem] flex-col rounded-card border border-surface-line bg-white shadow-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && !loading && (
            <div className="py-8">
              <p className="text-center text-sm text-ink-subtle">Try one of these:</p>
              <div className="mx-auto mt-4 flex max-w-xl flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-lg border border-surface-line px-4 py-3 text-left text-sm text-ink-muted transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-ink"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] break-anywhere rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-sunken text-ink'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="space-y-2 [&_a]:text-brand-700 [&_a]:underline [&_code]:rounded [&_code]:bg-surface-line [&_code]:px-1 [&_h2]:mt-3 [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:font-semibold">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface-sunken px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2 border-t border-surface-line p-4"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Your question
          </label>
          <input
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an activity, a concept, or a budget…"
            maxLength={2000}
            className="min-w-0 flex-1 rounded-lg border border-surface-line px-4 py-2.5 text-sm transition-colors hover:border-brand-300"
          />
          <Button type="submit" className="shrink-0" disabled={!input.trim() || loading}>
            Send
          </Button>
        </form>
      </div>

      <p className="mt-4 text-xs text-ink-subtle">
        AI-generated answers can be wrong. Check any procedure and its safety advice before running
        it with students.
      </p>
    </div>
  );
};

export default Assistant;
