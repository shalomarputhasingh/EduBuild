import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Authenticated encryption for provider API keys held in the database.
 *
 * AES-256-GCM: a tampered ciphertext fails to decrypt rather than producing
 * garbage, so a modified row is detected instead of being sent to a provider.
 *
 * The encryption key lives in SETTINGS_ENCRYPTION_KEY and never in the database.
 * That is the whole point — a database dump on its own does not yield API keys.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, the standard nonce size for GCM
const KEY_LENGTH = 32;

let cachedKey;

/** @returns {Buffer|null} the 32-byte key, or null when not configured. */
const getKey = () => {
  if (cachedKey !== undefined) return cachedKey;

  const raw = env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) {
    cachedKey = null;
    return null;
  }

  // Accept base64 or hex, so `openssl rand -base64 32` and `-hex 32` both work.
  let buffer;
  try {
    buffer = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  } catch {
    buffer = null;
  }

  if (!buffer || buffer.length !== KEY_LENGTH) {
    // Loud, because the symptom otherwise is "saving a key silently fails".
    console.error(
      `SETTINGS_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes. ` +
        'Generate one with: openssl rand -base64 32'
    );
    cachedKey = null;
    return null;
  }

  cachedKey = buffer;
  return cachedKey;
};

/** True when API keys can be stored through the UI. */
export const isEncryptionAvailable = () => getKey() !== null;

/**
 * @param {string} plaintext
 * @returns {string} `iv.authTag.ciphertext`, all base64
 */
export const encryptSecret = (plaintext) => {
  const key = getKey();
  if (!key) throw new Error('SETTINGS_ENCRYPTION_KEY is not configured');
  if (typeof plaintext !== 'string' || plaintext === '') {
    throw new Error('Nothing to encrypt');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
};

/**
 * @param {string} payload produced by encryptSecret
 * @returns {string|null} plaintext, or null if it cannot be decrypted
 */
export const decryptSecret = (payload) => {
  const key = getKey();
  if (!key || typeof payload !== 'string') return null;

  const parts = payload.split('.');
  if (parts.length !== 3) return null;

  try {
    const [iv, authTag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64'));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    // Wrong key, or the row was tampered with. Either way the caller gets
    // "not configured" rather than a corrupted key sent to a provider.
    return null;
  }
};

/**
 * A preview safe to send to a browser: enough to recognise which key is set,
 * not enough to use. `sk-proj-abc…9f2a`
 */
export const maskSecret = (plaintext) => {
  if (typeof plaintext !== 'string' || plaintext.length === 0) return null;
  if (plaintext.length <= 12) return `${'•'.repeat(6)}${plaintext.slice(-2)}`;
  return `${plaintext.slice(0, 6)}${'•'.repeat(6)}${plaintext.slice(-4)}`;
};

export default { encryptSecret, decryptSecret, maskSecret, isEncryptionAvailable };
