import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './respond.js';

/**
 * Authentication for route handlers.
 *
 * The Express versions of these were middleware that mutated `req`. A route
 * handler has no `next()`, so they are functions that return the caller's
 * identity — or throw an ApiError the `route()` wrapper turns into a response.
 *
 * The transport is unchanged: a Bearer token in the Authorization header,
 * issued at sign-in and held in localStorage by the client.
 */

const readToken = (request) => {
  const header = request.headers.get('authorization') || '';
  const [scheme, value] = header.split(' ');
  if (!value || scheme.toLowerCase() !== 'bearer') return null;
  return value.trim() || null;
};

const verify = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    // Expired, malformed, or signed with a rotated secret — all the same to a
    // caller, and none of them should say which.
    return null;
  }
};

/**
 * Identity if a valid token is present, otherwise null. Never throws.
 * Use for endpoints whose response varies by viewer but does not require one.
 */
export const optionalAuth = (request) => {
  const token = readToken(request);
  if (!token) return null;

  const decoded = verify(token);
  if (!decoded) return null;

  return { userId: decoded.id, role: decoded.role };
};

/** Identity, or a 401. */
export const requireAuth = (request) => {
  const token = readToken(request);
  if (!token) throw new ApiError(401, 'No token provided');

  const decoded = verify(token);
  if (!decoded) throw new ApiError(401, 'Invalid or expired token');

  return { userId: decoded.id, role: decoded.role };
};

/**
 * Identity, or a 401/403.
 *
 * The Express `adminOnly` middleware existed but was mounted on zero routes,
 * with the check re-implemented inline in one controller. Here it is the only
 * way to express the requirement, so it cannot be forgotten.
 */
export const requireAdmin = (request) => {
  const session = requireAuth(request);
  if (session.role !== 'admin') {
    throw new ApiError(403, 'This action requires an administrator account.');
  }
  return session;
};

export const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
