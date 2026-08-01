import rateLimit from 'express-rate-limit';

/**
 * Rate limits, tightest where abuse is most expensive.
 *
 * Authenticated routes key on user id so several teachers behind one school's
 * NAT do not share a budget. Anonymous routes fall back to IP.
 */
const keyByUserOrIp = (req) => req.userId || req.ip;

const json = (message) => (req, res) => {
  res.status(429).json({ message, code: 'RATE_LIMITED' });
};

const base = {
  standardHeaders: true,
  legacyHeaders: false,
};

/** Broad backstop applied to the whole API. */
export const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: json('Too many requests. Please slow down and try again shortly.'),
});

/** Credential endpoints: the budget a password-guessing attempt gets. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // Only failures count, so normal use is unaffected.
  handler: json('Too many sign-in attempts. Please wait a few minutes and try again.'),
});

/**
 * AI calls cost real money per request, so this is the tightest limit and is
 * keyed per user — the routes require authentication.
 */
export const aiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: keyByUserOrIp,
  handler: json('You have reached the hourly limit for AI requests. Please try again later.'),
});

/** Outbound oEmbed lookups; cheap but still an outbound request per call. */
export const youtubeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: keyByUserOrIp,
  handler: json('Too many video lookups. Please try again later.'),
});

/** Project create/update/delete. Generous for real editing, hostile to scripts. */
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: keyByUserOrIp,
  handler: json('Too many changes in a short period. Please try again later.'),
});
