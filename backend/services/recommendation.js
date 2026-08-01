/**
 * Project scoring for recommendations.
 *
 * Moved here from the frontend (src/utils/recommendation.js): it scored an
 * array the client happened to be holding, which stops working the moment the
 * library is paginated and the client only has one page.
 */

/**
 * @param {Array} projects  Candidate projects
 * @param {{budget?: number|null, classLevel?: string|null, subject?: string|null}} preferences
 * @returns {Array} the same projects, highest score first
 */
export const scoreProjects = (projects = [], preferences = {}) => {
  const { budget, classLevel, subject } = preferences;

  const score = (project) => {
    let value = 0;

    if (budget) {
      if (project.budget <= budget) value += 10;
      // A project well under budget leaves room for a second activity, which
      // teachers consistently prefer to spending the whole allowance at once.
      if (project.budget <= budget / 2) value += 5;
    }

    if (classLevel && project.classLevel === classLevel) value += 10;
    if (subject && project.subject === subject) value += 10;

    // Rating breaks ties between equally well-matched projects rather than
    // dominating the ranking.
    value += project.rating || 0;

    return value;
  };

  return [...projects].sort((a, b) => score(b) - score(a));
};

export default { scoreProjects };
