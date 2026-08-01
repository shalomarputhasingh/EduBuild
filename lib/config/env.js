/**
 * Server-side configuration.
 *
 * Next.js loads .env.local / .env itself before any module here runs, so there
 * is no dotenv call — adding one would fight Next's own precedence rules.
 *
 * Nothing in this file may be imported from a client component. None of these
 * names are NEXT_PUBLIC_-prefixed, so Next will not inline them into the browser
 * bundle; an accidental client import fails the build rather than leaking a key.
 */

const isProduction = process.env.NODE_ENV === 'production';

/** Names of required variables that were absent. Values are never recorded. */
const missing = [];

/**
 * Reads a variable, treating whitespace-only values as absent.
 * Never logs or returns the value in an error — only the variable name.
 */
const read = (name, { required = false, fallback = undefined } = {}) => {
  const raw = process.env[name];
  const value = typeof raw === 'string' ? raw.trim() : undefined;

  if (value) return value;
  if (fallback !== undefined) return fallback;
  if (required) missing.push(name);
  return undefined;
};

/** Reads a bounded positive integer without letting a malformed env value turn
 * a timeout or port into NaN. */
const readPositiveInteger = (name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number(read(name, { fallback: String(fallback) }));
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
};

// ─── Database ────────────────────────────────────────────────────────────────
// Either a single pooled connection string, or the discrete Supabase fields.
const DATABASE_URL = read('DATABASE_URL');

const discreteDb = {
  host: read('SUPABASE_DB_HOST'),
  port: Number(read('SUPABASE_DB_PORT', { fallback: '5432' })),
  database: read('SUPABASE_DB_NAME', { fallback: 'postgres' }),
  username: read('SUPABASE_DB_USER'),
  password: read('SUPABASE_DB_PASSWORD'),
};

const hasDiscreteDb = Boolean(discreteDb.host && discreteDb.username && discreteDb.password);

if (!DATABASE_URL && !hasDiscreteDb) {
  missing.push('DATABASE_URL (or SUPABASE_DB_HOST + SUPABASE_DB_USER + SUPABASE_DB_PASSWORD)');
}

// ─── Everything else ─────────────────────────────────────────────────────────
const JWT_SECRET = read('JWT_SECRET', { required: true });

/**
 * Optional, including in production.
 *
 * It was required back when the client and the API were separate servers and
 * this value was the CORS allowlist. They now share an origin, so there is no
 * cross-origin request to permit and nothing reads an allowlist. The only
 * remaining use is OpenRouter's attribution header.
 *
 * Keeping it required would fail `next build`, which runs with
 * NODE_ENV=production, for a variable the application does not use.
 */
const CLIENT_URL = read('CLIENT_URL');

// A short secret is as good as no secret. Enforce a floor in production.
if (isProduction && JWT_SECRET && JWT_SECRET.length < 32) {
  missing.push('JWT_SECRET (must be at least 32 characters in production)');
}

if (missing.length > 0) {
  const detail = missing.map((name) => `  - ${name}`).join('\n');
  const message = `Missing required environment variable(s):\n${detail}\n\nSee .env.example. Values are never printed.`;

  if (isProduction) {
    // Throwing rather than process.exit(1): this module is evaluated inside the
    // Next server, where killing the process would take down every route
    // including the ones that do not touch the database. A thrown error fails
    // the build (or the first request) loudly and names the variable.
    throw new Error(message);
  }
  console.warn(`\nWARNING: ${message}\nContinuing because NODE_ENV is not "production".\n`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  PORT: readPositiveInteger('PORT', 3000, { max: 65535 }),

  // Used only for OpenRouter's HTTP-Referer attribution header. The
  // `allowedOrigins` list that used to live here was removed: nothing consumed
  // it once CORS stopped being part of the architecture.
  CLIENT_URL,

  DATABASE_URL,
  db: discreteDb,
  hasDiscreteDb,

  JWT_SECRET,
  JWT_EXPIRES_IN: read('JWT_EXPIRES_IN', { fallback: '7d' }),

  // Encrypts provider API keys stored through the admin Settings page.
  // Optional: without it, keys can still be supplied via the variables below,
  // but the Settings page cannot save one.
  SETTINGS_ENCRYPTION_KEY: read('SETTINGS_ENCRYPTION_KEY'),

  AI_PROVIDER: (read('AI_PROVIDER', { fallback: 'gemini' }) || 'gemini').toLowerCase(),
  AI_TIMEOUT_MS: readPositiveInteger('AI_TIMEOUT_MS', 20_000, { min: 1_000, max: 120_000 }),
  GEMINI_API_KEY: read('GEMINI_API_KEY'),
  GEMINI_MODEL: read('GEMINI_MODEL'),
  OPENAI_API_KEY: read('OPENAI_API_KEY'),
  OPENAI_MODEL: read('OPENAI_MODEL', { fallback: 'gpt-4o-mini' }),
  GROQ_API_KEY: read('GROQ_API_KEY'),
  GROQ_MODEL: read('GROQ_MODEL', { fallback: 'llama-3.3-70b-versatile' }),
  OPENROUTER_API_KEY: read('OPENROUTER_API_KEY'),
  OPENROUTER_MODEL: read('OPENROUTER_MODEL', { fallback: 'meta-llama/llama-3.3-70b-instruct:free' }),

  YOUTUBE_API_KEY: read('YOUTUBE_API_KEY'),
};

export default env;
