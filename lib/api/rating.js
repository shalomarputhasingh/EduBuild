import { Feedback, Project, sequelize } from '../models/index.js';

/**
 * Recomputes a project's average rating from its feedback rows.
 *
 * A single aggregate rather than loading every row and reducing in JS — the
 * original approach pulled a project's whole review table on every submit.
 */
export const recalculateRating = async (projectId) => {
  const result = await Feedback.findOne({
    where: { projectId },
    attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average']],
    raw: true,
  });

  const average = Number(result?.average) || 0;
  const rounded = Math.round(average * 10) / 10;
  await Project.update({ rating: rounded }, { where: { id: projectId } });
  return rounded;
};

export default recalculateRating;
