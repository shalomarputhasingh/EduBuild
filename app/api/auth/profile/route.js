import { connectDB } from '@/lib/config/db';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/api/auth';
import { ApiError, json, route } from '@/lib/api/respond';
import { publicUser } from '@/lib/api/publicUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async (request) => {
  const { userId } = requireAuth(request);
  await connectDB();

  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // The Express version returned the model instance directly. That relied on
  // the default scope hiding the password column; going through publicUser
  // makes the guarantee explicit rather than incidental.
  return json(publicUser(user));
});
