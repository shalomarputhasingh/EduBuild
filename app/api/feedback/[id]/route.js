import { connectDB } from '@/lib/config/db';
import { Feedback } from '@/lib/models';
import { requireAuth } from '@/lib/api/auth';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseParams } from '@/lib/api/input';
import { recalculateRating } from '@/lib/api/rating';
import { idParam } from '@/lib/schemas/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const DELETE = route(async (request, context) => {
  const { userId, role } = requireAuth(request);
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const record = await Feedback.findByPk(id);
  if (!record) throw new ApiError(404, 'Review not found');

  if (role !== 'admin' && record.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own review.');
  }

  const { projectId } = record;
  await record.destroy();
  await recalculateRating(projectId);

  return json({ message: 'Review deleted.' });
});
