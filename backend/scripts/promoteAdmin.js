#!/usr/bin/env node
/**
 * Promote an existing account to admin.
 *
 *   node scripts/promoteAdmin.js someone@example.com
 *   node scripts/promoteAdmin.js someone@example.com --demote
 *
 * This is the only way to create an admin. `POST /api/auth/signup` always
 * creates a plain `user` and ignores any `role` in the request body.
 *
 * The script never accepts, sets, or prints a password.
 */
import { sequelize, connectDB } from '../config/db.js';
import User from '../models/User.js';

const [, , emailArg, ...flags] = process.argv;
const demote = flags.includes('--demote');

if (!emailArg) {
  console.error('Usage: node scripts/promoteAdmin.js <email> [--demote]');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const targetRole = demote ? 'user' : 'admin';

try {
  await connectDB();

  const user = await User.findOne({ where: { email } });

  if (!user) {
    console.error(`No account found for ${email}.`);
    console.error('The account must sign up through the app first.');
    process.exit(1);
  }

  if (user.role === targetRole) {
    console.log(`${email} is already "${targetRole}". Nothing to do.`);
    process.exit(0);
  }

  const previousRole = user.role;
  user.role = targetRole;
  await user.save();

  console.log(`${email}: ${previousRole} -> ${targetRole}`);
} catch (error) {
  console.error('Failed to update role:', error.message);
  process.exit(1);
} finally {
  await sequelize.close();
}
