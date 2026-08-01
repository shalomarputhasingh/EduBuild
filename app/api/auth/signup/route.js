import { connectDB } from '@/lib/config/db';
import { User } from '@/lib/models';
import { signToken } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { publicUser } from '@/lib/api/publicUser';
import { signupSchema } from '@/lib/schemas/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Every signup creates a plain `user` account.
 *
 * Admin rights are granted out-of-band by an operator running
 * `npm run promote-admin -- <email>`. There is deliberately no self-service
 * path to `role: 'admin'` — the schema strips a client-supplied `role` rather
 * than honouring it.
 */
export const POST = route(async (request) => {
  enforceRateLimit(request, LIMITS.auth);
  await connectDB();

  const { name, email, password, school, state } = await parseBody(request, signupSchema);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'That email is already registered. Try signing in instead.');
  }

  const user = await User.create({ name, email, password, school, state, role: 'user' });

  return json(
    {
      message: 'Welcome to EDUBUILD.',
      token: signToken(user),
      user: publicUser(user),
    },
    201
  );
});
