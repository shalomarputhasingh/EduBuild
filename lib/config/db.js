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

/**
 * Serverless platforms run many short-lived instances, each with its own pool.
 * A `max` of 10 there is really 10 × the number of warm instances, which
 * exhausts the connection limit quickly. One connection per instance is the
 * right shape when a pooler sits in front of the database anyway.
 */
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const sharedOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
    connectTimeout: 10000,
  },
  pool: isServerless
    ? { max: 1, min: 0, idle: 5000, acquire: 20000 }
    : { max: 10, min: 0, idle: 10000, acquire: 30000 },
  define: {
    timestamps: true,
  },
};

const createSequelize = () =>
  env.DATABASE_URL
    ? new Sequelize(env.DATABASE_URL, sharedOptions)
    : new Sequelize(env.db.database, env.db.username, env.db.password, {
        ...sharedOptions,
        host: env.db.host,
        port: env.db.port,
      });

/**
 * The instance is cached on `globalThis`.
 *
 * Next.js re-evaluates server modules on every hot reload in development, and
 * runs route handlers in a module scope that can be torn down and rebuilt. A
 * plain module-level `new Sequelize(...)` therefore creates a fresh connection
 * pool on each reload and never closes the old one, which exhausts Supabase's
 * connection limit within a few minutes of editing. Caching on the global keeps
 * exactly one pool for the life of the process.
 */
const globalForDb = globalThis;

export const sequelize = globalForDb.__edubuildSequelize ?? createSequelize();

if (!env.isProduction) {
  globalForDb.__edubuildSequelize = sequelize;
}

/**
 * Verifies the connection once per process.
 *
 * Route handlers call this rather than each opening their own connection. The
 * promise is memoised so concurrent requests during a cold start share a single
 * authenticate() round trip instead of stampeding.
 */
export const connectDB = async () => {
  if (!globalForDb.__edubuildDbReady) {
    globalForDb.__edubuildDbReady = sequelize
      .authenticate()
      .then(() => {
        console.log('PostgreSQL connected (Supabase)');
      })
      .catch((error) => {
        // Clear the memo so the next request retries rather than being stuck
        // with a permanently rejected promise.
        globalForDb.__edubuildDbReady = null;
        throw error;
      });
  }
  return globalForDb.__edubuildDbReady;
};

export default sequelize;
