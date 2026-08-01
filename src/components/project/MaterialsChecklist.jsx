'use client';

import React, { useEffect, useState } from 'react';

const formatCost = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value || 0);

/**
 * Materials list with checkboxes, for gathering supplies before a lesson.
 *
 * Ticked items persist in localStorage per project — a teacher collecting
 * materials over several days should not lose their place on a page refresh.
 */
const MaterialsChecklist = ({ materials = [], projectId }) => {
  const storageKey = `edubuild.checklist.${projectId}`;

  // Empty on the server, restored after mount — see LanguageContext for why
  // reading storage during the first render is not an option here.
  const [checked, setChecked] = useState(() => new Set());
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      setChecked(new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')));
    } catch {
      setChecked(new Set());
    }
    setRestored(true);
  }, [storageKey]);

  useEffect(() => {
    // Do not write before the restore has run, or the first render's empty set
    // would overwrite what the teacher had already ticked.
    if (!restored) return;
    localStorage.setItem(storageKey, JSON.stringify([...checked]));
  }, [checked, storageKey, restored]);

  const toggle = (name) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (materials.length === 0) {
    return <p className="text-sm text-ink-subtle">No materials listed for this project.</p>;
  }

  const priced = materials.filter((m) => typeof m.estimatedCost === 'number');
  const total = priced.reduce((sum, m) => sum + m.estimatedCost, 0);

  return (
    <div>
      <ul className="divide-y divide-surface-line">
        {materials.map((material, index) => {
          const isChecked = checked.has(material.name);
          const inputId = `material-${projectId}-${index}`;

          return (
            <li key={index} className="flex items-start gap-3 py-3">
              <input
                id={inputId}
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(material.name)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-surface-line text-brand-600 focus:ring-brand-600"
              />
              <label htmlFor={inputId} className="flex-1 cursor-pointer">
                <span
                  className={`font-medium ${isChecked ? 'text-ink-subtle line-through' : 'text-ink'}`}
                >
                  {material.name}
                </span>
                {material.quantity && (
                  <span className="ml-2 text-sm text-ink-subtle">× {material.quantity}</span>
                )}
                {material.alternative && (
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    Or use: {material.alternative}
                  </span>
                )}
                {material.note && (
                  <span className="mt-0.5 block text-sm text-ink-subtle">{material.note}</span>
                )}
              </label>
              {typeof material.estimatedCost === 'number' && (
                <span className="shrink-0 text-sm font-medium text-ink-muted">
                  {formatCost(material.estimatedCost)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {priced.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-surface-line pt-3">
          <span className="text-sm font-medium text-ink">
            Estimated total
            {priced.length < materials.length && (
              <span className="ml-1 font-normal text-ink-subtle">
                ({priced.length} of {materials.length} priced)
              </span>
            )}
          </span>
          <span className="font-semibold text-brand-700">{formatCost(total)}</span>
        </div>
      )}
    </div>
  );
};

export default MaterialsChecklist;
