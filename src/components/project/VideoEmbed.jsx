import React, { useState } from 'react';

/**
 * YouTube embed behind a click-to-load facade.
 *
 * Rendering the iframe immediately would pull several hundred kilobytes of
 * YouTube player code — and set cookies — on every visit to a project page,
 * whether or not anyone watches. The thumbnail is a plain image; the iframe is
 * only created once the teacher presses play.
 *
 * `youtube-nocookie.com` is used so no tracking cookie is set even then.
 */
const VideoEmbed = ({ videoId, videoTitle, videoChannel, videoThumbnail, videoUrl }) => {
  const [playing, setPlaying] = useState(false);

  if (!videoId) return null;

  const title = videoTitle || 'Tutorial video';
  const thumbnail = videoThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const watchUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
      <div className="relative aspect-video bg-slate-900">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video: ${title}`}
          >
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
                <span className="ml-1 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          {videoChannel && <p className="truncate text-xs text-ink-subtle">{videoChannel}</p>}
        </div>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          Watch on YouTube
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
};

export default VideoEmbed;
