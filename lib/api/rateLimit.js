import { ApiError } from './respond.js';

/**
 * Rate limiting without Express.
 *
 * `express-rate-limit` is middleware and cannot run in a route handler, so this
 * is a small fixed-window counter with the same budgets the Express version
 * used. Authenticated routes key on user id so several teachers behind one
 * school's NAT do not share a budget; anonymous routes fall back to IP.
 *
 * Two limits of an in-memory store, both accepted deliberately:
 *  - It is per-process. Behind more than one instance the effective limit
 *    multiplies by the instance count. For a single-instance deployment this is
 *    exact; for a horizontally scaled one, move the store to Redis or Postgres.
 *  - It resets on redeploy. That is a smaller problem than the alternative of
 *    an unthrottled AI endpoint billing a real account.
 */

const globalForLimits = globalThis;

/** Survives hot reloads; without this every edit hands everyone a fresh budget. */
const buckets = globalForLimits.__edubuildRateBuckets ?? new Map();
globalForLimits.__edubuildRateBuckets = buckets;

/**
 * Collapses an IPv6 address to its /64 prefix.
 *
 * Keying on a full IPv6 address lets a client with a routed allocation get a
 * fresh budget for every address in it, which is the defect the Express
 * version's `ipKeyGenerator` helper existed to prevent.
 */
const normaliseIp = (ip) => {
  if (!ip) return 'unknown';
  if (!ip.includes(':')) return ip;
  const hextets = ip.split('%')[0].split(':');
  return hextets.slice(0, 4).join(':') + '::/64';
};

/**
 * Next does not expose a request IP directly. Behind a proxy the first
 * X-Forwarded-For entry is the client; only one hop is trusted, because
 * trusting the whole chain lets a client spoof the header and evade the limit.
 */
const clientIp = (request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return normaliseIp(forwarded.split(',')[0].trim());
  return normaliseIp(request.headers.get('x-real-ip'));
};

/** Drops expired windows so the map cannot grow without bound. */
const sweep = (now) => {
  if (buckets.size < 5000) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
};

/**
 * Consumes one unit from a bucket, throwing a 429 when it is empty.
 *
 * @param {Request} request
 * @param {{ name: string, windowMs: number, limit: number, message: string }} rule
 * @param {string|null} userId  Present for authenticated routes.
 */
export const enforceRateLimit = (request, rule, userId = null) => {
  const now = Date.now();
  sweep(now);

  const key = `${rule.name}:${userId || clientIp(request)}`;
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  entry.count += 1;

  if (entry.count > rule.limit) {
    const error = new ApiError(429, rule.message, 'RATE_LIMITED');
    error.retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    throw error;
  }
};

const MINUTE = 60 * 1000;

/** Tightest where abuse is most expensive. */
export const LIMITS = {
  /** Credential endpoints: the budget a password-guessing attempt gets. */
  auth: {
    name: 'auth',
    windowMs: 15 * MINUTE,
    limit: 10,
    message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  },

  /** AI calls cost real money per request. Keyed per user; the routes require auth. */
  ai: {
    name: 'ai',
    windowMs: 60 * MINUTE,
    limit: 20,
    message: 'You have reached the hourly limit for AI requests. Please try again later.',
  },

  /** Outbound oEmbed lookups; cheap, but still an outbound request per call. */
  youtube: {
    name: 'youtube',
    windowMs: 60 * MINUTE,
    limit: 30,
    message: 'Too many video lookups. Please try again later.',
  },

  /** Project create/update/delete. Generous for real editing, hostile to scripts. */
  write: {
    name: 'write',
    windowMs: 60 * MINUTE,
    limit: 30,
    message: 'Too many changes in a short period. Please try again later.',
  },
};

export default enforceRateLimit;
