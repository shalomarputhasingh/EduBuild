import { connectDB } from '@/lib/config/db';
import { Project } from '@/lib/models';
import { requireAdmin } from '@/lib/api/auth';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody, parseParams } from '@/lib/api/input';
import { normalizeProject } from '@/lib/utils/normalizeProject';
import { updateStatusSchema } from '@/lib/schemas/projectSchemas';
import { idParam } from '@/lib/schemas/common';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Moderation. Admin-only, enforced by requireAdmin rather than an inline check. */
export const PATCH = route(async (request, context) => {
  requireAdmin(request);
  const { id } = await parseParams(context, idParam);
  await connectDB();

  const { status, rejectionReason } = await parseBody(request, updateStatusSchema);

  const project = await Project.findByPk(id);
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

  return json({
    message: status === 'approved' ? 'Project approved and published.' : 'Project rejected.',
    project: normalizeProject(project),
  });
});
