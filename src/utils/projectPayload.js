/**
 * Converts form state into the API payload, and an API project back into form
 * state.
 *
 * The form keeps every field as a string because that is what inputs produce.
 * The API expects numbers, and expects blank optional fields to be absent
 * rather than empty strings.
 */

const blankToUndefined = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed === '' || trimmed == null ? undefined : trimmed;
};

const numberOrUndefined = (value) => {
  if (value === '' || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/** Form values → POST/PUT body. */
export const toPayload = (values) => ({
  title: values.title?.trim(),
  summary: blankToUndefined(values.summary),
  description: values.description?.trim(),

  subject: values.subject,
  concept: blankToUndefined(values.concept),
  classLevel: values.classLevel,
  difficulty: values.difficulty,
  tags: (values.tags || []).map((t) => t.trim()).filter(Boolean),
  language: values.language || 'en',

  budget: numberOrUndefined(values.budget) ?? 0,
  estimatedTimeMinutes: numberOrUndefined(values.estimatedTimeMinutes) ?? null,

  materials: (values.materials || [])
    .filter((m) => m.name?.trim())
    .map((m) => ({
      name: m.name.trim(),
      quantity: blankToUndefined(m.quantity),
      estimatedCost: numberOrUndefined(m.estimatedCost) ?? null,
      alternative: blankToUndefined(m.alternative),
      note: blankToUndefined(m.note),
    })),

  steps: (values.steps || [])
    .filter((s) => s.description?.trim())
    .map((s) => ({
      title: blankToUndefined(s.title),
      description: s.description.trim(),
      imageUrl: blankToUndefined(s.imageUrl),
      safetyNote: blankToUndefined(s.safetyNote),
      videoTimestamp: blankToUndefined(s.videoTimestamp),
    })),

  learningOutcomes: (values.learningOutcomes || []).map((o) => o.trim()).filter(Boolean),
  safetyPrecautions: (values.safetyPrecautions || []).map((s) => s.trim()).filter(Boolean),

  image: blankToUndefined(values.image),
  videoUrl: values.videoUrl?.trim() ?? '',
});

/**
 * API project → form values.
 *
 * The API always returns the structured shape (the backend normalizes legacy
 * string arrays on read), so this only has to convert types, not shapes.
 */
export const toFormValues = (project) => ({
  title: project.title || '',
  summary: project.summary || '',
  description: project.description || '',

  subject: project.subject || 'Physics',
  concept: project.concept || '',
  classLevel: project.classLevel || '6-8',
  difficulty: project.difficulty || 'Medium',
  tags: project.tags || [],
  language: project.language || 'en',

  budget: project.budget ?? '',
  estimatedTimeMinutes: project.estimatedTimeMinutes ?? '',

  materials:
    project.materials?.length > 0
      ? project.materials.map((m) => ({
          name: m.name || '',
          quantity: m.quantity || '',
          estimatedCost: m.estimatedCost ?? '',
          alternative: m.alternative || '',
          note: m.note || '',
        }))
      : [{ name: '', quantity: '', estimatedCost: '', alternative: '', note: '' }],

  steps:
    project.steps?.length > 0
      ? project.steps.map((s) => ({
          title: s.title || '',
          description: s.description || '',
          imageUrl: s.imageUrl || '',
          safetyNote: s.safetyNote || '',
          videoTimestamp: s.videoTimestamp || '',
        }))
      : [{ title: '', description: '', imageUrl: '', safetyNote: '', videoTimestamp: '' }],

  learningOutcomes: project.learningOutcomes || [],
  safetyPrecautions: project.safetyPrecautions || [],

  image: project.image || '',
  videoUrl: project.videoUrl || '',
});

export default { toPayload, toFormValues };
