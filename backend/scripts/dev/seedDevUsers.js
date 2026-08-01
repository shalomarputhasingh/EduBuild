#!/usr/bin/env node
/**
 * Create throwaway accounts for local development.
 *
 *   node scripts/dev/seedDevUsers.js
 *
 * Passwords are randomly generated and printed once. There are no fixed
 * default credentials, and this script refuses to run in production.
 */
import crypto from 'crypto';
import { sequelize, connectDB } from '../../config/db.js';
import { env } from '../../config/env.js';
import User from '../../models/User.js';

if (env.isProduction) {
  console.error('Refusing to run: NODE_ENV is "production".');
  console.error('This script creates accounts with generated passwords and is for local use only.');
  process.exit(1);
}

const randomPassword = () => crypto.randomBytes(12).toString('base64url');

const accounts = [
  { name: 'Dev Admin', email: 'dev-admin@example.test', role: 'admin', school: 'Dev School', state: 'Dev State' },
  { name: 'Dev Teacher', email: 'dev-teacher@example.test', role: 'user', school: 'Dev School', state: 'Dev State' },
];

try {
  await connectDB();

  const created = [];

  for (const account of accounts) {
    const existing = await User.findOne({ where: { email: account.email } });
    if (existing) {
      console.log(`${account.email}: already exists, skipped`);
      continue;
    }

    const password = randomPassword();
    await User.create({ ...account, password });
    created.push({ email: account.email, role: account.role, password });
  }

  if (created.length === 0) {
    console.log('\nNothing to create.');
  } else {
    console.log('\nCreated accounts. These passwords are shown once — copy them now:\n');
    console.table(created);
    console.log('These are local development accounts. Never create them on a deployed database.\n');
  }
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exit(1);
} finally {
  await sequelize.close();
}
