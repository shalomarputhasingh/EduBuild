import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

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
const CLIENT_URL = read('CLIENT_URL', { required: isProduction, fallback: isProduction ? undefined : 'http://localhost:5173' });

// A short secret is as good as no secret. Enforce a floor in production.
if (isProduction && JWT_SECRET && JWT_SECRET.length < 32) {
  missing.push('JWT_SECRET (must be at least 32 characters in production)');
}

if (missing.length > 0) {
  const detail = missing.map((name) => `  - ${name}`).join('\n');
  const message = `Missing required environment variable(s):\n${detail}\n\nSee backend/.env.example. Values are never printed.`;

  if (isProduction) {
    console.error(`\nFATAL: ${message}\n`);
    process.exit(1);
  }
  console.warn(`\nWARNING: ${message}\nContinuing because NODE_ENV is not "production".\n`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction,
  PORT: Number(read('PORT', { fallback: '5000' })),

  // Comma-separated list so staging and production origins can coexist.
  CLIENT_URL,
  allowedOrigins: (CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

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
  AI_TIMEOUT_MS: Number(read('AI_TIMEOUT_MS', { fallback: '20000' })),
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
