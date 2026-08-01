import { Op } from 'sequelize';
import { connectDB } from '@/lib/config/db';
import { Project } from '@/lib/models';
import { requireAuth } from '@/lib/api/auth';
import { json, route } from '@/lib/api/respond';
import { parseQuery } from '@/lib/api/input';
import { normalizeProjects } from '@/lib/utils/normalizeProject';
import { scoreProjects } from '@/lib/services/recommendation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Recommends approved projects for the signed-in teacher.
 *
 * Scoring lives on the server because the client no longer holds the full
 * project list — once the library is paginated, a client-side ranking would
 * only ever be ranking the current page.
 */
export const GET = route(async (request) => {
  requireAuth(request);
  await connectDB();

  const q = parseQuery(request);
  const budget = Number(q.budget) || null;
  const classLevel = q.classLevel || null;
  const subject = q.subject || null;
  const limit = Math.min(Number(q.limit) || 3, 12);

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

  return json({ data: normalizeProjects(ranked) });
});
