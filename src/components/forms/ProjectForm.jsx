'use client';

import React, { useState } from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { TextInput, TextArea, Select, Field } from './Field';
import RepeatableList, { StringListInput } from './RepeatableList';
import VideoUrlField from './VideoUrlField';
import StepList from '../project/StepList';
import MaterialsChecklist from '../project/MaterialsChecklist';

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Engineering'];
const CLASS_LEVELS = ['6-8', '9-10', '11-12'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'materials', label: 'Materials' },
  { id: 'steps', label: 'Steps' },
  { id: 'outcomes', label: 'Outcomes & safety' },
  { id: 'media', label: 'Media' },
  { id: 'review', label: 'Review' },
];

export const emptyProject = {
  title: '',
  summary: '',
  description: '',
  subject: 'Physics',
  concept: '',
  classLevel: '6-8',
  difficulty: 'Medium',
  budget: '',
  estimatedTimeMinutes: '',
  materials: [{ name: '', quantity: '', estimatedCost: '', alternative: '', note: '' }],
  steps: [{ title: '', description: '', imageUrl: '', safetyNote: '', videoTimestamp: '' }],
  learningOutcomes: [],
  safetyPrecautions: [],
  tags: [],
  image: '',
  videoUrl: '',
};

const newMaterial = () => ({ name: '', quantity: '', estimatedCost: '', alternative: '', note: '' });
const newStep = () => ({ title: '', description: '', imageUrl: '', safetyNote: '', videoTimestamp: '' });

/**
 * Multi-section guide editor, shared by the submit and edit pages.
 *
 * Materials and steps are repeatable structured rows rather than the previous
 * comma-separated and newline-separated textareas, which silently mangled any
 * material containing a comma or step spanning two lines.
 */
const ProjectForm = ({ initialValues = emptyProject, onSubmit, submitting, submitLabel, errors = {} }) => {
  const [values, setValues] = useState(initialValues);
  const [section, setSection] = useState('basics');

  const set = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  const sectionIndex = SECTIONS.findIndex((s) => s.id === section);
  const goTo = (index) => {
    setSection(SECTIONS[index].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Preview needs the same shape the detail page renders, with blanks dropped.
  const previewMaterials = values.materials
    .filter((m) => m.name?.trim())
    .map((m) => ({
      ...m,
      estimatedCost: m.estimatedCost === '' ? null : Number(m.estimatedCost),
    }));
  const previewSteps = values.steps.filter((s) => s.description?.trim());

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Section navigation */}
      <nav className="scroll-x mb-6" aria-label="Form sections">
        <ol className="flex min-w-max gap-2">
          {SECTIONS.map((s, index) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSection(s.id)}
                aria-current={s.id === section ? 'step' : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  s.id === section
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-ink-muted ring-1 ring-surface-line hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                <span className="mr-1.5 opacity-70">{index + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-900">Please fix the following before submitting:</p>
          <ul className="mt-2 list-inside list-disc text-sm text-red-800">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-card border border-surface-line bg-white p-6 shadow-card">
        {/* ─── Basics ─────────────────────────────────────────────────────── */}
        {section === 'basics' && (
          <div className="flex flex-col gap-5">
            <TextInput
              label="Project title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
              placeholder="e.g. Balloon-powered car"
              maxLength={160}
              required
            />

            <TextInput
              label="One-line summary"
              value={values.summary}
              onChange={(e) => set('summary', e.target.value)}
              error={errors.summary}
              hint="Shown on the project card. Keep it under 280 characters."
              maxLength={280}
              placeholder="Demonstrates Newton's third law using a bottle and a balloon."
            />

            <TextArea
              label="Full description"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              error={errors.description}
              rows={5}
              required
              hint="What the activity is, what students observe, and why it matters."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Subject"
                options={SUBJECTS}
                value={values.subject}
                onChange={(e) => set('subject', e.target.value)}
                error={errors.subject}
                required
              />
              <TextInput
                label="Concept taught"
                value={values.concept}
                onChange={(e) => set('concept', e.target.value)}
                error={errors.concept}
                placeholder="e.g. Newton's third law"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Class level"
                options={CLASS_LEVELS.map((c) => ({ value: c, label: `Class ${c}` }))}
                value={values.classLevel}
                onChange={(e) => set('classLevel', e.target.value)}
                error={errors.classLevel}
                required
              />
              <Select
                label="Difficulty"
                options={DIFFICULTIES}
                value={values.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                error={errors.difficulty}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput
                label="Estimated budget (₹)"
                type="number"
                min="0"
                value={values.budget}
                onChange={(e) => set('budget', e.target.value)}
                error={errors.budget}
                required
                hint="Total cost to run this once."
              />
              <TextInput
                label="Time needed (minutes)"
                type="number"
                min="1"
                value={values.estimatedTimeMinutes}
                onChange={(e) => set('estimatedTimeMinutes', e.target.value)}
                error={errors.estimatedTimeMinutes}
                placeholder="45"
              />
            </div>

            <Field label="Tags" htmlFor="tags-list" hint="Helps other teachers find this guide.">
              <StringListInput
                items={values.tags}
                onChange={(tags) => set('tags', tags)}
                placeholder="e.g. recycled materials"
                addLabel="Add tag"
                itemLabel="Tag"
              />
            </Field>
          </div>
        )}

        {/* ─── Materials ──────────────────────────────────────────────────── */}
        {section === 'materials' && (
          <div>
            <h2 className="text-lg font-bold text-ink">Materials</h2>
            <p className="mb-5 mt-1 text-sm text-ink-muted">
              List everything needed. Prices are optional, but they let the guide show a total —
              which is usually the first thing another teacher wants to know.
            </p>

            <RepeatableList
              items={values.materials}
              onChange={(materials) => set('materials', materials)}
              createItem={newMaterial}
              addLabel="Add material"
              itemLabel="Material"
              min={1}
              emptyHint="No materials yet."
              renderItem={(material, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Name"
                    value={material.name}
                    onChange={(e) => update({ ...material, name: e.target.value })}
                    placeholder="Plastic bottle (1.5L)"
                  />
                  <TextInput
                    label="Quantity"
                    value={material.quantity}
                    onChange={(e) => update({ ...material, quantity: e.target.value })}
                    placeholder="2"
                  />
                  <TextInput
                    label="Approximate cost (₹)"
                    type="number"
                    min="0"
                    value={material.estimatedCost}
                    onChange={(e) => update({ ...material, estimatedCost: e.target.value })}
                    placeholder="20"
                  />
                  <TextInput
                    label="Cheaper alternative"
                    value={material.alternative}
                    onChange={(e) => update({ ...material, alternative: e.target.value })}
                    placeholder="Any rigid container"
                  />
                  <TextInput
                    className="sm:col-span-2"
                    label="Note"
                    value={material.note}
                    onChange={(e) => update({ ...material, note: e.target.value })}
                    placeholder="Wash and dry before use"
                  />
                </div>
              )}
            />
          </div>
        )}

        {/* ─── Steps ──────────────────────────────────────────────────────── */}
        {section === 'steps' && (
          <div>
            <h2 className="text-lg font-bold text-ink">Build steps</h2>
            <p className="mb-5 mt-1 text-sm text-ink-muted">
              One action per step. Put a safety note on the step it applies to, not at the end —
              that is where a teacher will actually read it.
            </p>

            <RepeatableList
              items={values.steps}
              onChange={(steps) => set('steps', steps)}
              createItem={newStep}
              addLabel="Add step"
              itemLabel="Step"
              min={1}
              emptyHint="No steps yet."
              renderItem={(step, update) => (
                <div className="flex flex-col gap-3">
                  <TextInput
                    label="Step heading"
                    value={step.title}
                    onChange={(e) => update({ ...step, title: e.target.value })}
                    placeholder="Attach the wheels"
                  />
                  <TextArea
                    label="What to do"
                    rows={3}
                    value={step.description}
                    onChange={(e) => update({ ...step, description: e.target.value })}
                    placeholder="Slide a skewer through each straw and press a bottle cap onto both ends."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      label="Image URL"
                      value={step.imageUrl}
                      onChange={(e) => update({ ...step, imageUrl: e.target.value })}
                      placeholder="https://…"
                    />
                    <TextInput
                      label="Video timestamp"
                      value={step.videoTimestamp}
                      onChange={(e) => update({ ...step, videoTimestamp: e.target.value })}
                      placeholder="2:15"
                    />
                  </div>
                  <TextInput
                    label="Safety note for this step"
                    value={step.safetyNote}
                    onChange={(e) => update({ ...step, safetyNote: e.target.value })}
                    placeholder="Adult supervision for cutting"
                  />
                </div>
              )}
            />
          </div>
        )}

        {/* ─── Outcomes & safety ──────────────────────────────────────────── */}
        {section === 'outcomes' && (
          <div className="flex flex-col gap-8">
            <Field
              label="Learning outcomes"
              htmlFor="outcomes-list"
              hint="What a student should understand afterwards."
            >
              <StringListInput
                items={values.learningOutcomes}
                onChange={(list) => set('learningOutcomes', list)}
                placeholder="Understands action–reaction pairs"
                addLabel="Add outcome"
                itemLabel="Outcome"
              />
            </Field>

            <Field
              label="Safety precautions"
              htmlFor="safety-list"
              hint="Overall precautions. Step-specific warnings belong on the step itself."
            >
              <StringListInput
                items={values.safetyPrecautions}
                onChange={(list) => set('safetyPrecautions', list)}
                placeholder="Adult supervision required when using scissors"
                addLabel="Add precaution"
                itemLabel="Precaution"
              />
            </Field>
          </div>
        )}

        {/* ─── Media ──────────────────────────────────────────────────────── */}
        {section === 'media' && (
          <div className="flex flex-col gap-5">
            <TextInput
              label="Cover image URL"
              value={values.image}
              onChange={(e) => set('image', e.target.value)}
              error={errors.image}
              placeholder="https://…"
              hint="A photo of the finished project works best."
            />

            {values.image && (
              <img
                src={values.image}
                alt="Cover preview"
                className="max-h-64 w-full rounded-lg border border-surface-line object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}

            <VideoUrlField
              value={values.videoUrl}
              onChange={(url) => set('videoUrl', url)}
              error={errors.videoUrl}
            />
          </div>
        )}

        {/* ─── Review ─────────────────────────────────────────────────────── */}
        {section === 'review' && (
          <div>
            <h2 className="text-lg font-bold text-ink">Review before submitting</h2>
            <p className="mb-6 mt-1 text-sm text-ink-muted">
              This is roughly how the guide will read once published.
            </p>

            <div className="rounded-lg border border-surface-line bg-surface-sunken p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge tone="brand">{values.subject}</Badge>
                <Badge>Class {values.classLevel}</Badge>
                <Badge tone="info">{values.difficulty}</Badge>
              </div>

              <h3 className="text-2xl font-bold text-ink">{values.title || 'Untitled project'}</h3>
              {values.summary && <p className="mt-2 text-ink-muted">{values.summary}</p>}

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-ink-subtle">Budget</dt>
                  <dd className="font-semibold text-ink">₹{values.budget || '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Time</dt>
                  <dd className="font-semibold text-ink">
                    {values.estimatedTimeMinutes ? `${values.estimatedTimeMinutes} min` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Materials</dt>
                  <dd className="font-semibold text-ink">{previewMaterials.length}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Steps</dt>
                  <dd className="font-semibold text-ink">{previewSteps.length}</dd>
                </div>
              </dl>

              {values.description && (
                <div className="mt-5 border-t border-surface-line pt-4">
                  <h4 className="mb-2 font-semibold text-ink">Overview</h4>
                  <p className="prose-guide whitespace-pre-line">{values.description}</p>
                </div>
              )}

              {previewMaterials.length > 0 && (
                <div className="mt-5 border-t border-surface-line pt-4">
                  <h4 className="mb-2 font-semibold text-ink">Materials</h4>
                  <MaterialsChecklist materials={previewMaterials} projectId="preview" />
                </div>
              )}

              {previewSteps.length > 0 && (
                <div className="mt-5 border-t border-surface-line pt-4">
                  <h4 className="mb-3 font-semibold text-ink">Steps</h4>
                  <StepList steps={previewSteps} />
                </div>
              )}
            </div>

            <p className="mt-5 rounded-lg border border-surface-line bg-white px-4 py-3 text-sm text-ink-muted">
              A moderator reviews every submission for clarity and classroom safety before it is
              published. You will see the outcome, and any requested changes, on your dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => goTo(sectionIndex - 1)}
          disabled={sectionIndex === 0}
        >
          Back
        </Button>

        <div className="flex gap-3">
          {sectionIndex < SECTIONS.length - 1 ? (
            <Button onClick={() => goTo(sectionIndex + 1)}>Next: {SECTIONS[sectionIndex + 1].label}</Button>
          ) : (
            <Button type="submit" size="lg" loading={submitting}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProjectForm;
