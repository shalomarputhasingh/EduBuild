import React from 'react';

/**
 * Numbered build steps.
 *
 * Safety notes render inline at the step they apply to, not collected in a
 * footnote — a warning about hot glue is only useful next to the gluing step.
 */
const StepList = ({ steps = [] }) => {
  if (steps.length === 0) {
    return <p className="text-sm text-ink-subtle">No steps have been added to this guide yet.</p>;
  }

  return (
    <ol className="space-y-6">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-4">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {index + 1}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            {step.title && <h3 className="mb-1 font-semibold text-ink">{step.title}</h3>}
            <p className="prose-guide whitespace-pre-line">{step.description}</p>

            {step.imageUrl && (
              <img
                src={step.imageUrl}
                alt={`Step ${index + 1}`}
                loading="lazy"
                className="mt-3 max-h-80 w-full rounded-lg border border-surface-line object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}

            {step.safetyNote && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Safety: </span>
                {step.safetyNote}
              </p>
            )}

            {step.videoTimestamp && (
              <p className="mt-2 text-xs text-ink-subtle">
                Shown in the video at {step.videoTimestamp}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default StepList;
