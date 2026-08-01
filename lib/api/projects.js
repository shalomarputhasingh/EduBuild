import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { ApiError } from './respond.js';
import { resolveVideo, emptyVideoFields } from '../services/youtube/oembed.js';

/**
 * Shared project logic, lifted out of the Express controller so the several
 * route handlers that need it (list, read, create, update, related) do not each
 * carry their own copy.
 */

/**
 * Fields a client may write. Anything outside this list is dropped.
 *
 * Notably absent: createdBy (would let a creator reassign ownership),
 * rating (derived from feedback), status and rejectionReason (moderation only),
 * and id/timestamps.
 */
const WRITABLE_FIELDS = [
  'title',
  'summary',
  'description',
  'subject',
  'concept',
  'classLevel',
  'difficulty',
  'tags',
  'language',
  'budget',
  'estimatedTimeMinutes',
  'materials',
  'steps',
  'learningOutcomes',
  'safetyPrecautions',
  'image',
];

export const pickWritable = (body) => {
  const out = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
};

/**
 * Resolves the video columns from a pasted URL.
 *
 * Metadata is fetched server-side rather than trusted from the request, so a
 * client cannot store an arbitrary title or point the thumbnail at another host.
 */
export const resolveVideoFields = async (videoUrl) => {
  if (videoUrl === undefined) return {};
  if (!videoUrl || videoUrl.trim() === '') return emptyVideoFields();

  const resolved = await resolveVideo(videoUrl);
  if (!resolved) {
    throw new ApiError(400, 'That does not look like a YouTube link.', 'INVALID_VIDEO_URL');
  }

  const { embedUrl, watchUrl, partial, ...fields } = resolved;
  return fields;
};

/**
 * Builds the visibility clause for the caller.
 *
 * - anonymous: approved only
 * - user:      approved, plus their own in any status
 * - admin:     everything
 */
export const visibilityClause = (userId, userRole) => {
  if (userRole === 'admin') return null;
  if (userId) return { [Op.or]: [{ status: 'approved' }, { createdBy: userId }] };
  return { status: 'approved' };
};

export const creatorInclude = {
  model: User,
  as: 'creator',
  attributes: ['id', 'name', 'school', 'state'],
};
