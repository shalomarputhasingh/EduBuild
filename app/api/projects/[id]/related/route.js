import { Op } from 'sequelize';
import { connectDB } from '@/lib/config/db';
import { Project } from '@/lib/models';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseParams } from '@/lib/api/input';
import { creatorInclude } from '@/lib/api/projects';
import { normalizeProject, normalizeProjects } from '@/lib/utils/normalizeProject';
import { idParam } from '@/lib/schemas/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async (request, context) => {
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const project = await Project.findByPk(id);
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

  return json({ data: normalizeProjects(related) });
});
