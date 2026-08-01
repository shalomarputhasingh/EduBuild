import { connectDB } from '@/lib/config/db';
import { Project } from '@/lib/models';
import { optionalAuth, requireAuth } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody, parseParams } from '@/lib/api/input';
import { creatorInclude, pickWritable, resolveVideoFields } from '@/lib/api/projects';
import { normalizeProject } from '@/lib/utils/normalizeProject';
import { updateProjectSchema } from '@/lib/schemas/projectSchemas';
import { idParam } from '@/lib/schemas/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Read one ────────────────────────────────────────────────────────────────
export const GET = route(async (request, context) => {
  const session = optionalAuth(request);
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const project = await Project.findByPk(id, { include: [creatorInclude] });
  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = session?.role === 'admin';
  const isCreator = session?.userId && project.createdBy === session.userId;

  if (project.status !== 'approved' && !isAdmin && !isCreator) {
    // 404 rather than 403: a stranger should not be able to confirm that an
    // unapproved project exists at this id.
    throw new ApiError(404, 'Project not found');
  }

  return json(normalizeProject(project));
});

// ─── Update ──────────────────────────────────────────────────────────────────
export const PUT = route(async (request, context) => {
  const { userId, role } = requireAuth(request);
  enforceRateLimit(request, LIMITS.write, userId);
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const project = await Project.findByPk(id);
  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = role === 'admin';
  const isCreator = project.createdBy === userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'You can only edit your own projects.');
  }

  const body = await parseBody(request, updateProjectSchema);
  const fields = pickWritable(body);
  const videoFields = await resolveVideoFields(body.videoUrl);

  const update = { ...fields, ...videoFields };

  // A teacher's edit sends the guide back through review. An admin's edit does
  // not, so a moderator can fix a typo without unpublishing the project.
  if (!isAdmin) {
    update.status = 'pending';
    update.rejectionReason = null;
  }

  await project.update(update);

  return json({
    message: isAdmin ? 'Project updated.' : 'Project updated and resubmitted for review.',
    project: normalizeProject(project),
  });
});

// ─── Delete ──────────────────────────────────────────────────────────────────
export const DELETE = route(async (request, context) => {
  const { userId, role } = requireAuth(request);
  enforceRateLimit(request, LIMITS.write, userId);
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const project = await Project.findByPk(id);
  if (!project) throw new ApiError(404, 'Project not found');

  const isAdmin = role === 'admin';
  const isCreator = project.createdBy === userId;

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'You can only delete your own projects.');
  }

  await project.destroy();
  return json({ message: 'Project deleted.' });
});
