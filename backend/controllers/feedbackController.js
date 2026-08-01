import { Feedback, Project, User, sequelize } from '../models/index.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Recomputes a project's average rating from its feedback rows.
 *
 * A single aggregate rather than loading every row and reducing in JS — the
 * previous approach pulled a project's whole review table on every submit.
 */
const recalculateRating = async (projectId) => {
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

export const submitFeedback = async (req, res) => {
  const { projectId, difficulty, feedback, rating } = req.body;

  const project = await Project.findByPk(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.status !== 'approved' && req.userRole !== 'admin') {
    throw new ApiError(403, 'You can only review published projects.');
  }

  // Identity comes from the authenticated account, never from the request body.
  // Accepting a name from the client would let anyone review under another
  // teacher's name and school.
  const author = await User.findByPk(req.userId);
  if (!author) throw new ApiError(401, 'Your session is no longer valid. Please sign in again.');

  // A second submission is an edit. The unique constraint would reject an
  // insert anyway, so treat it as the update the teacher clearly intended.
  const existing = await Feedback.findOne({ where: { projectId, userId: req.userId } });

  const values = {
    difficulty,
    feedback,
    rating,
    userName: author.name,
    schoolName: author.school || '',
  };

  const record = existing
    ? await existing.update(values)
    : await Feedback.create({ ...values, projectId, userId: req.userId });

  const projectRating = await recalculateRating(projectId);

  res.status(existing ? 200 : 201).json({
    message: existing ? 'Your review has been updated.' : 'Thanks for your review.',
    feedback: record,
    projectRating,
  });
};

export const getProjectFeedback = async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByPk(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  const feedback = await Feedback.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  const ratings = feedback.map((f) => f.rating).filter((r) => typeof r === 'number');
  const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  res.json({
    data: feedback,
    total: feedback.length,
    averageRating: Math.round(average * 10) / 10,
  });
};

export const deleteFeedback = async (req, res) => {
  const record = await Feedback.findByPk(req.params.id);
  if (!record) throw new ApiError(404, 'Review not found');

  if (req.userRole !== 'admin' && record.userId !== req.userId) {
    throw new ApiError(403, 'You can only delete your own review.');
  }

  const { projectId } = record;
  await record.destroy();
  await recalculateRating(projectId);

  res.json({ message: 'Review deleted.' });
};
