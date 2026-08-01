import { Sequelize } from 'sequelize';
import { env } from './env.js';

/**
 * Supabase PostgreSQL connection.
 *
 * The schema is owned by the SQL migrations in `supabase/migrations/` and applied
 * with the Supabase CLI (`supabase db push`). Sequelize is used purely as a query
 * builder and model layer here — `sequelize.sync()` is deliberately never called,
 * so the running process can never mutate the hosted schema.
 *
 * Connection notes:
 *  - Supabase serves a certificate that Node's default trust store rejects, so
 *    `rejectUnauthorized: false` is the documented Supabase setting. The transport
 *    is still encrypted.
 *  - Use the session pooler (port 5432) for a long-lived Node process; the
 *    transaction pooler (6543) is for serverless/edge deployments.
 */

const sharedOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
    connectTimeout: 10000,
  },
  pool: {
    max: 10,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
  define: {
    timestamps: true,
  },
};

const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, sharedOptions)
  : new Sequelize(env.db.database, env.db.username, env.db.password, {
      ...sharedOptions,
      host: env.db.host,
      port: env.db.port,
    });

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('PostgreSQL connected (Supabase)');
};

export { sequelize, connectDB };
