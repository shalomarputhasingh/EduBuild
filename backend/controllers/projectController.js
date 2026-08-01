import { Op } from 'sequelize';
import { Project, User, sequelize } from '../models/index.js';
import { ApiError } from '../middleware/errorHandler.js';
import { normalizeProject, normalizeProjects } from '../utils/normalizeProject.js';
import { resolveVideo, emptyVideoFields } from '../services/youtube/oembed.js';
import { SORT_OPTIONS } from '../schemas/projectQuerySchema.js';

/**
 * Fields a client may write. Anything outside this list is dropped.
 *
 * Notably absent: createdBy (would let a creator reassign ownership),
 * rating (derived from feedback), status and rejectionReason (moderation only),
 * and id/timestamps.
 */
const WRITABLE_FIELDS = [
  'title',
  'summary',
  'description',
  'subject',
  'concept',
  'classLevel',
  'difficulty',
  'tags',
  'language',
  'budget',
  'estimatedTimeMinutes',
  'materials',
  'steps',
  'learningOutcomes',
  'safetyPrecautions',
  'image',
];

const pickWritable = (body) => {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
};

/**
 * Resolves the video columns from a pasted URL.
 *
 * Metadata is fetched server-side rather than trusted from the request, so a
 * client cannot store an arbitrary title or point the thumbnail at another host.
 */
const resolveVideoFields = async (videoUrl) => {
  if (videoUrl === undefined) return {};
  if (!videoUrl || videoUrl.trim() === '') return emptyVideoFields();

  const resolved = await resolveVideo(videoUrl);
  if (!resolved) {
    throw new ApiError(400, 'That does not look like a YouTube link.', 'INVALID_VIDEO_URL');
  }

  const { embedUrl, watchUrl, partial, ...fields } = resolved;
  return fields;
};

/**
 * Builds the visibility clause for the caller.
 *
 * - anonymous: approved only
 * - user:      approved, plus their own in any status
 * - admin:     everything
 */
const visibilityClause = (userId, userRole) => {
  if (userRole === 'admin') return null;
  if (userId) return { [Op.or]: [{ status: 'approved' }, { createdBy: userId }] };
  return { status: 'approved' };
};

const creatorInclude = {
  model: User,
  as: 'creator',
  attributes: ['id', 'name', 'school', 'state'],
};

// ─── List ────────────────────────────────────────────────────────────────────
export const getAllProjects = async (req, res) => {
  const q = req.validatedQuery;
  const { userId, userRole } = req;
  const isAdmin = userRole === 'admin';

  const and = [];

  const visibility = visibilityClause(userId, userRole);
  if (visibility) and.push(visibility);

  // A status filter narrows within what the caller may already see. For a
  // non-admin that intersects with the visibility clause above, so asking for
  // `pending` returns their own pending projects and nobody else's.
  if (q.status) and.push({ status: q.status });

  if (q.subject) and.push({ subject: q.subject });
  if (q.classLevel) and.push({ classLevel: q.classLevel });
  if (q.difficulty) and.push({ difficulty: q.difficulty });

  if (q.budgetMin != null) and.push({ budget: { [Op.gte]: q.budgetMin } });
  if (q.budgetMax != null) and.push({ budget: { [Op.lte]: q.budgetMax } });

  if (q.search) {
    const term = `%${q.search}%`;
    and.push({
      [Op.or]: [
        { title: { [Op.iLike]: term } },
        { summary: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
        { concept: { [Op.iLike]: term } },
        // Match inside the tags array without leaving the parameterized query.
        sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: term }),
      ],
    });
  }

  if (q.tag) {
    and.push(
      sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), {
        [Op.iLike]: `%${q.tag}%`,
      })
    );
  }

  if (q.material) {
    // Matches both shapes: structured rows store {name: "..."} and legacy rows
    // store a bare string, and casting to text covers both.
    and.push(
      sequelize.where(sequelize.cast(sequelize.col('materials'), 'text'), {
        [Op.iLike]: `%${q.material}%`,
      })
    );
  }

  const { rows, count } = await Project.findAndCountAll({
    where: and.length > 0 ? { [Op.and]: and } : undefined,
    order: SORT_OPTIONS[q.sort],
    limit: q.limit,
    offset: (q.page - 1) * q.limit,
    include: [creatorInclude],
    distinct: true,
  });

  res.json({
    data: normalizeProjects(rows),
    page: q.page,
    limit: q.limit,
    total: count,
    totalPages: Math.max(1, Math.ceil(count / q.limit)),
    isAdmin,
  });
};

// ─── Read one ────────────────────────────────────────────────────────────────
export const getProjectById = async (req, res) => {
  const project = await Project.findByPk(req.params.id, { include: [creatorInclude] });

  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = req.userRole === 'admin';
  const isCreator = req.userId && project.createdBy === req.userId;

  if (project.status !== 'approved' && !isAdmin && !isCreator) {
    // 404 rather than 403: a stranger should not be able to confirm that an
    // unapproved project exists at this id.
    throw new ApiError(404, 'Project not found');
  }

  res.json(normalizeProject(project));
};

// ─── Create ──────────────────────────────────────────────────────────────────
export const createProject = async (req, res) => {
  const fields = pickWritable(req.body);
  const videoFields = await resolveVideoFields(req.body.videoUrl);

  const project = await Project.create({
    ...fields,
    ...videoFields,
    createdBy: req.userId,
    // An admin publishing directly does not need to review their own work.
    status: req.userRole === 'admin' ? 'approved' : 'pending',
    rating: 0,
  });

  res.status(201).json({
    message:
      req.userRole === 'admin'
        ? 'Project published.'
        : 'Project submitted. You can track its approval status on your dashboard.',
    project: normalizeProject(project),
  });
};

// ─── Update ──────────────────────────────────────────────────────────────────
export const updateProject = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = req.userRole === 'admin';
  const isCreator = project.createdBy === req.userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'You can only edit your own projects.');
  }

  const fields = pickWritable(req.body);
  const videoFields = await resolveVideoFields(req.body.videoUrl);

  const update = { ...fields, ...videoFields };

  // A teacher's edit sends the guide back through review. An admin's edit does
  // not, so a moderator can fix a typo without unpublishing the project.
  if (!isAdmin) {
    update.status = 'pending';
    update.rejectionReason = null;
  }

  await project.update(update);

  res.json({
    message: isAdmin ? 'Project updated.' : 'Project updated and resubmitted for review.',
    project: normalizeProject(project),
  });
};

// ─── Moderate ────────────────────────────────────────────────────────────────
export const updateProjectStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;

  const project = await Project.findByPk(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.status === status) {
    throw new ApiError(409, `This project is already ${status}.`);
  }

  await project.update({
    status,
    // The database CHECK constraint requires a reason on rejection and none
    // otherwise, so clear it whenever we are not rejecting.
    rejectionReason: status === 'rejected' ? rejectionReason : null,
  });

  res.json({
    message: status === 'approved' ? 'Project approved and published.' : 'Project rejected.',
    project: normalizeProject(project),
  });
};

// ─── Delete ──────────────────────────────────────────────────────────────────
export const deleteProject = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = req.userRole === 'admin';
  const isCreator = project.createdBy === req.userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'You can only delete your own projects.');
  }

  await project.destroy();
  res.json({ message: 'Project deleted.' });
};

// ─── Related ─────────────────────────────────────────────────────────────────
export const getRelatedProjects = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  // Fetch a candidate pool, then rank in JS. Ranking in SQL would mean building
  // a CASE expression from values, and string-interpolating into a query is the
  // habit this codebase is moving away from — even where the values are enums.
  const candidates = await Project.findAll({
    where: {
      status: 'approved',
      id: { [Op.ne]: project.id },
      [Op.or]: [{ subject: project.subject }, { classLevel: project.classLevel }],
    },
    order: [['rating', 'DESC']],
    limit: 24,
    include: [creatorInclude],
  });

  const tags = new Set(normalizeProject(project).tags);

  const score = (candidate) => {
    let value = 0;
    if (candidate.subject === project.subject) value += 3;
    if (candidate.classLevel === project.classLevel) value += 2;
    if (candidate.difficulty === project.difficulty) value += 1;
    const shared = normalizeProject(candidate).tags.filter((t) => tags.has(t)).length;
    value += Math.min(shared, 3);
    return value + (candidate.rating || 0) / 10;
  };

  const related = candidates.sort((a, b) => score(b) - score(a)).slice(0, 4);

  res.json({ data: normalizeProjects(related) });
};
