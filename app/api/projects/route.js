import { Op } from 'sequelize';
import { connectDB } from '@/lib/config/db';
import { Project, sequelize } from '@/lib/models';
import { optionalAuth, requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { json, route } from '@/lib/api/respond';
import { parseBody, parseQuery } from '@/lib/api/input';
import { creatorInclude, pickWritable, resolveVideoFields, visibilityClause } from '@/lib/api/projects';
import { normalizeProject, normalizeProjects } from '@/lib/utils/normalizeProject';
import { projectQuerySchema, SORT_OPTIONS } from '@/lib/schemas/projectQuerySchema';
import { createProjectSchema } from '@/lib/schemas/projectSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── List ────────────────────────────────────────────────────────────────────
export const GET = route(async (request) => {
  const session = optionalAuth(request);
  await connectDB();

  const q = parseQuery(request, projectQuerySchema);
  const userId = session?.userId;
  const userRole = session?.role;
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

  return json({
    data: normalizeProjects(rows),
    page: q.page,
    limit: q.limit,
    total: count,
    totalPages: Math.max(1, Math.ceil(count / q.limit)),
    isAdmin,
  });
});

// ─── Create ──────────────────────────────────────────────────────────────────
export const POST = route(async (request) => {
  const { userId, role } = requireAuth(request);
  enforceRateLimit(request, LIMITS.write, userId);
  await connectDB();

  const body = await parseBody(request, createProjectSchema);
  const fields = pickWritable(body);
  const videoFields = await resolveVideoFields(body.videoUrl);

  const project = await Project.create({
    ...fields,
    ...videoFields,
    createdBy: userId,
    // An admin publishing directly does not need to review their own work.
    status: role === 'admin' ? 'approved' : 'pending',
    rating: 0,
  });

  return json(
    {
      message:
        role === 'admin'
          ? 'Project published.'
          : 'Project submitted. You can track its approval status on your dashboard.',
      project: normalizeProject(project),
    },
    201
  );
});
