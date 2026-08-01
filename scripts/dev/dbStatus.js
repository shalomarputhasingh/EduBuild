#!/usr/bin/env node
/**
 * Connectivity and row-count diagnostic.
 *
 *   node scripts/dev/dbStatus.js
 *
 * Reads connection settings from the environment via config/env.js.
 * Prints table names and counts — never any credential.
 */
import { sequelize, connectDB } from '../../config/db.js';

try {
  await connectDB();

  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log('\nTables:');
  console.table(tables.map((t) => t.table_name));

  for (const table of ['edubuild_users', 'edubuild_projects', 'edubuild_feedbacks']) {
    const exists = tables.some((t) => t.table_name === table);
    if (!exists) {
      console.log(`${table}: missing — run "npx supabase db push"`);
      continue;
    }
    const [[{ count }]] = await sequelize.query(`SELECT count(*) FROM "${table}"`);
    console.log(`${table}: ${count} row(s)`);
  }

  const [roles] = await sequelize.query(
    `SELECT role, count(*) FROM edubuild_users GROUP BY role ORDER BY role`
  );
  if (roles.length > 0) {
    console.log('\nRoles:');
    console.table(roles);
  }
} catch (error) {
  console.error('Database check failed:', error.message);
  process.exit(1);
} finally {
  await sequelize.close();
}
