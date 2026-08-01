import React from 'react';
import Button from '../common/Button';

/**
 * Add/remove/reorder rows for a list field.
 *
 * This is what replaces the old comma-separated materials box and
 * newline-separated steps box. Those textareas were lossy by construction:
 * a material with a comma in it, or a step spanning two lines, silently split
 * into the wrong thing.
 */
const RepeatableList = ({
  items,
  onChange,
  renderItem,
  createItem,
  addLabel = 'Add item',
  emptyHint,
  itemLabel = 'Item',
  min = 0,
}) => {
  const update = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && emptyHint && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-ink-subtle">
          {emptyHint}
        </p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-surface-sunken p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}
                className="rounded p-1.5 text-ink-subtle transition-colors hover:bg-slate-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}
                className="rounded p-1.5 text-ink-subtle transition-colors hover:bg-slate-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={items.length <= min}
                aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ✕
              </button>
            </div>
          </div>

          {renderItem(item, (value) => update(index, value), index)}
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={() => onChange([...items, createItem()])}>
        + {addLabel}
      </Button>
    </div>
  );
};

/** Simple list of plain strings — outcomes, safety notes, tags. */
export const StringListInput = ({ items, onChange, placeholder, addLabel, itemLabel }) => (
  <RepeatableList
    items={items}
    onChange={onChange}
    createItem={() => ''}
    addLabel={addLabel}
    itemLabel={itemLabel}
    emptyHint={`No entries yet. Use "${addLabel}" to add one.`}
    renderItem={(item, update) => (
      <input
        value={item}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        aria-label={itemLabel}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-slate-400 focus:border-brand-600"
      />
    )}
  />
);

export default RepeatableList;
