import { connectDB } from '@/lib/config/db';
import { Feedback, Project } from '@/lib/models';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseParams } from '@/lib/api/input';
import { projectIdParam } from '@/lib/schemas/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async (request, context) => {
  const { projectId } = await parseParams(context, projectIdParam);
  await connectDB();

  const project = await Project.findByPk(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  const feedback = await Feedback.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  const ratings = feedback.map((f) => f.rating).filter((r) => typeof r === 'number');
  const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return json({
    data: feedback,
    total: feedback.length,
    averageRating: Math.round(average * 10) / 10,
  });
});
