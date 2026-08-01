'use client';

import React, { useEffect, useRef, useState } from 'react';
import { previewVideo } from '../../services/api';
import { errorMessage } from '../../api/axios';
import { TextInput } from './Field';
import Spinner from '../common/Spinner';

/**
 * YouTube URL input with a live preview.
 *
 * The lookup goes through the backend, which uses YouTube's keyless oEmbed
 * endpoint — no API key, no quota. Metadata shown here is only a preview; the
 * server re-resolves it when the project is saved, so a client cannot store an
 * arbitrary title or point the thumbnail at another host.
 */
const VideoUrlField = ({ value, onChange, error }) => {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | invalid
  const [message, setMessage] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    const url = (value || '').trim();

    if (!url) {
      setPreview(null);
      setStatus('idle');
      setMessage('');
      return undefined;
    }

    // Debounced so a lookup does not fire on every keystroke while pasting.
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setMessage('');

      previewVideo(url, { signal: controller.signal })
        .then((data) => {
          setPreview(data);
          setStatus('ready');
          if (data.partial) {
            setMessage(
              'The link is valid, but video details could not be loaded right now. It will still be saved.'
            );
          }
        })
        .catch((err) => {
          if (controller.signal.aborted || err.code === 'ERR_CANCELED') return;
          setPreview(null);
          setStatus('invalid');
          setMessage(errorMessage(err, 'That does not look like a YouTube link.'));
        });
    }, 600);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value]);

  return (
    <div>
      <TextInput
        label="Tutorial video (YouTube)"
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        error={error || (status === 'invalid' ? message : undefined)}
        placeholder="https://www.youtube.com/watch?v=…"
        hint="Optional. Paste any YouTube link — details are fetched automatically."
      />

      {status === 'loading' && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <Spinner size="sm" label="Checking video" />
          Checking the link…
        </p>
      )}

      {status === 'ready' && preview && (
        <div className="mt-3 flex gap-3 rounded-lg border border-surface-line bg-surface-sunken p-3 sm:gap-4">
          {preview.videoThumbnail && (
            <img
              src={preview.videoThumbnail}
              alt=""
              className="h-16 w-24 shrink-0 rounded object-cover sm:h-20 sm:w-32"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-ink">{preview.videoTitle || 'Video linked'}</p>
            {preview.videoChannel && (
              <p className="mt-0.5 text-sm text-ink-subtle">{preview.videoChannel}</p>
            )}
            {message && <p className="mt-1 text-sm text-amber-700">{message}</p>}
            <button
              type="button"
              onClick={() => onChange('')}
              className="mt-2 text-sm font-medium text-red-700 hover:underline"
            >
              Remove video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUrlField;
