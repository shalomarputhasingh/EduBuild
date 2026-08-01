import { connectDB } from '@/lib/config/db';
import { Feedback, Project, User } from '@/lib/models';
import { requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { recalculateRating } from '@/lib/api/rating';
import { submitFeedbackSchema } from '@/lib/schemas/feedbackSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request) => {
  const { userId, role } = requireAuth(request);
  enforceRateLimit(request, LIMITS.write, userId);
  await connectDB();

  const { projectId, difficulty, feedback, rating } = await parseBody(
    request,
    submitFeedbackSchema
  );

  const project = await Project.findByPk(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  if (project.status !== 'approved' && role !== 'admin') {
    throw new ApiError(403, 'You can only review published projects.');
  }

  // Identity comes from the authenticated account, never from the request body.
  // Accepting a name from the client would let anyone review under another
  // teacher's name and school.
  const author = await User.findByPk(userId);
  if (!author) throw new ApiError(401, 'Your session is no longer valid. Please sign in again.');

  // A second submission is an edit. The unique constraint would reject an
  // insert anyway, so treat it as the update the teacher clearly intended.
  const existing = await Feedback.findOne({ where: { projectId, userId } });

  const values = {
    difficulty,
    feedback,
    rating,
    userName: author.name,
    schoolName: author.school || '',
  };

  const record = existing
    ? await existing.update(values)
    : await Feedback.create({ ...values, projectId, userId });

  const projectRating = await recalculateRating(projectId);

  return json(
    {
      message: existing ? 'Your review has been updated.' : 'Thanks for your review.',
      feedback: record,
      projectRating,
    },
    existing ? 200 : 201
  );
});
