import { connectDB } from '@/lib/config/db';
import { User } from '@/lib/models';
import { signToken } from '@/lib/api/auth';
import { enforceRateLimit, LIMITS } from '@/lib/api/rateLimit';
import { ApiError, json, route } from '@/lib/api/respond';
import { parseBody } from '@/lib/api/input';
import { publicUser } from '@/lib/api/publicUser';
import { signinSchema } from '@/lib/schemas/authSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = route(async (request) => {
  enforceRateLimit(request, LIMITS.auth);
  await connectDB();

  const { email, password } = await parseBody(request, signinSchema);

  // The password column is excluded by the model's default scope, so it has to
  // be requested explicitly here — the one place that legitimately needs it.
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Identical response whether the account is missing or the password is wrong,
  // so this cannot be used to enumerate which addresses are registered.
  const isPasswordValid = user ? await user.comparePassword(password) : false;
  if (!user || !isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return json({
    message: 'Signed in.',
    token: signToken(user),
    user: publicUser(user),
  });
});
