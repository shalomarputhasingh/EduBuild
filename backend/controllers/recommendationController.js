import { Op } from 'sequelize';
import { Project } from '../models/index.js';
import { normalizeProjects } from '../utils/normalizeProject.js';
import { scoreProjects } from '../services/recommendation.js';

/**
 * Recommends approved projects for the signed-in teacher.
 *
 * Scoring moved to the backend because the client no longer holds the full
 * project list — once the library is paginated, a client-side ranking would
 * only ever be ranking the current page.
 */
export const getRecommendedProjects = async (req, res) => {
  const budget = Number(req.query.budget) || null;
  const classLevel = req.query.classLevel || null;
  const subject = req.query.subject || null;
  const limit = Math.min(Number(req.query.limit) || 3, 12);

  const candidates = await Project.findAll({
    where: {
      status: 'approved',
      ...(budget ? { budget: { [Op.lte]: budget * 1.5 } } : {}),
    },
    // Bounded pool: ranking is cheap, but loading the whole table is not.
    order: [['rating', 'DESC']],
    limit: 100,
  });

  const ranked = scoreProjects(candidates, { budget, classLevel, subject }).slice(0, limit);

  res.json({ data: normalizeProjects(ranked) });
};
