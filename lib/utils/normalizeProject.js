/**
 * Conversion between the legacy and structured shapes of `materials` and `steps`.
 *
 * Before the structured guide model, both columns held arrays of plain strings:
 *
 *   materials: ["Cardboard", "Tape"]
 *   steps:     ["Cut the cardboard", "Tape the edges"]
 *
 * They now hold arrays of objects. Rather than rewriting every stored row —
 * a destructive migration that would need to be right the first time — these
 * functions convert on read and on write. The API therefore always emits the
 * structured shape regardless of when a row was written, and always accepts
 * either shape from a client.
 *
 * The practical effect: no existing project renders blank, an old client keeps
 * working, and a backfill migration becomes an optional optimization rather
 * than a prerequisite.
 */

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  // A single value where a list was expected is a list of one.
  return [value];
};

const cleanString = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * @returns {Array<{name, quantity, estimatedCost, alternative, note}>}
 */
export const normalizeMaterials = (value) =>
  asArray(value)
    .map((item) => {
      if (typeof item === 'string') {
        const name = cleanString(item);
        return name ? { name, quantity: null, estimatedCost: null, alternative: null, note: null } : null;
      }

      if (item && typeof item === 'object') {
        const name = cleanString(item.name);
        if (!name) return null;
        return {
          name,
          quantity: cleanString(item.quantity) ?? null,
          estimatedCost: toNumberOrNull(item.estimatedCost),
          alternative: cleanString(item.alternative) ?? null,
          note: cleanString(item.note) ?? null,
        };
      }

      return null;
    })
    .filter(Boolean);

/**
 * @returns {Array<{title, description, imageUrl, safetyNote, videoTimestamp}>}
 */
export const normalizeSteps = (value) =>
  asArray(value)
    .map((item) => {
      if (typeof item === 'string') {
        const description = cleanString(item);
        return description
          ? { title: null, description, imageUrl: null, safetyNote: null, videoTimestamp: null }
          : null;
      }

      if (item && typeof item === 'object') {
        // A legacy row could hold {en: [...]} from the old multilingual
        // experiment; that shape never reached the database, but be forgiving.
        const description = cleanString(item.description) ?? cleanString(item.text);
        if (!description) return null;
        return {
          title: cleanString(item.title) ?? null,
          description,
          imageUrl: cleanString(item.imageUrl) ?? null,
          safetyNote: cleanString(item.safetyNote) ?? null,
          videoTimestamp: cleanString(item.videoTimestamp) ?? null,
        };
      }

      return null;
    })
    .filter(Boolean);

/** Plain string arrays: outcomes, precautions, tags. */
export const normalizeStringList = (value) =>
  asArray(value)
    .map((item) => (typeof item === 'string' ? cleanString(item) : cleanString(item?.name)))
    .filter(Boolean);

/** Sum of the material line costs, or null when nothing is priced. */
export const calculateMaterialsCost = (materials) => {
  const priced = normalizeMaterials(materials).filter((m) => typeof m.estimatedCost === 'number');
  if (priced.length === 0) return null;
  return priced.reduce((sum, m) => sum + m.estimatedCost, 0);
};

/**
 * Normalizes a project for output. Accepts a Sequelize instance or a plain
 * object and always returns a plain object.
 */
export const normalizeProject = (project) => {
  if (!project) return project;

  const plain = typeof project.toJSON === 'function' ? project.toJSON() : { ...project };

  return {
    ...plain,
    materials: normalizeMaterials(plain.materials),
    steps: normalizeSteps(plain.steps),
    learningOutcomes: normalizeStringList(plain.learningOutcomes),
    safetyPrecautions: normalizeStringList(plain.safetyPrecautions),
    tags: normalizeStringList(plain.tags),
    materialsCost: calculateMaterialsCost(plain.materials),
  };
};

export const normalizeProjects = (projects) => (projects || []).map(normalizeProject);

export default {
  normalizeMaterials,
  normalizeSteps,
  normalizeStringList,
  normalizeProject,
  normalizeProjects,
  calculateMaterialsCost,
};
