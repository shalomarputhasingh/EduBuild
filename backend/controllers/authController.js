import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  school: user.school,
  state: user.state,
});

/**
 * Every signup creates a plain `user` account.
 *
 * Admin rights are granted out-of-band by an operator running
 * `node scripts/promoteAdmin.js <email>`. There is deliberately no
 * self-service path to `role: 'admin'` — a client-supplied `role` in the
 * request body is ignored rather than honoured.
 */
export const signup = async (req, res) => {
  const { name, email, password, school, state } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'That email is already registered. Try signing in instead.');
  }

  const user = await User.create({
    name,
    email,
    password,
    school,
    state,
    role: 'user',
  });

  res.status(201).json({
    message: 'Welcome to EDUBUILD.',
    token: signToken(user),
    user: publicUser(user),
  });
};

export const signin = async (req, res) => {
  const { email, password } = req.body;

  // The password column is excluded by the model's default scope, so it has to
  // be requested explicitly here — the one place that legitimately needs it.
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Identical response whether the account is missing or the password is wrong,
  // so this cannot be used to enumerate which addresses are registered.
  const isPasswordValid = user ? await user.comparePassword(password) : false;
  if (!user || !isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  res.json({
    message: 'Signed in.',
    token: signToken(user),
    user: publicUser(user),
  });
};

export const getProfile = async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
};
