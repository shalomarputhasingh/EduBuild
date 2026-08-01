import { AiProviderSetting } from '../../models/index.js';
import { decryptSecret, encryptSecret, maskSecret, isEncryptionAvailable } from '../../utils/crypto.js';
import { env } from '../../config/env.js';

/**
 * Resolves provider configuration from two sources, database first.
 *
 * Precedence is deliberate: a key saved through the admin UI overrides the
 * environment. An operator can still set everything via env vars and never open
 * the settings page — which is what an existing deployment does — but once an
 * admin configures a provider in the app, that is the one that wins. Without a
 * clear order, "I saved a key and nothing changed" becomes very hard to explain.
 */

export const PROVIDERS = ['gemini', 'openai', 'groq', 'openrouter', 'mock'];

/** Environment fallbacks, and the names used in error messages. */
const ENV_CONFIG = {
  gemini: { key: () => env.GEMINI_API_KEY, model: () => env.GEMINI_MODEL, keyName: 'GEMINI_API_KEY' },
  openai: { key: () => env.OPENAI_API_KEY, model: () => env.OPENAI_MODEL, keyName: 'OPENAI_API_KEY' },
  groq: { key: () => env.GROQ_API_KEY, model: () => env.GROQ_MODEL, keyName: 'GROQ_API_KEY' },
  openrouter: {
    key: () => env.OPENROUTER_API_KEY,
    model: () => env.OPENROUTER_MODEL,
    keyName: 'OPENROUTER_API_KEY',
  },
  mock: { key: () => 'not-required', model: () => null, keyName: null },
};

export const envKeyName = (provider) => ENV_CONFIG[provider]?.keyName ?? null;

/**
 * Rows are read on nearly every AI request, so they are cached briefly. The TTL
 * is short enough that a settings change takes effect without a restart, and
 * invalidateCache() makes it immediate after a write.
 */
const CACHE_TTL_MS = 30_000;
let cache = null;
let cacheExpiry = 0;

export const invalidateCache = () => {
  cache = null;
  cacheExpiry = 0;
};

const loadRows = async () => {
  if (cache && Date.now() < cacheExpiry) return cache;

  try {
    const rows = await AiProviderSetting.scope('withSecret').findAll();
    cache = new Map(rows.map((row) => [row.provider, row]));
    cacheExpiry = Date.now() + CACHE_TTL_MS;
  } catch (error) {
    // A missing table (migration 0008 not yet applied) must not take the AI
    // routes down — env-var configuration still works.
    console.warn('[ai] Could not read provider settings, falling back to environment:', error.message);
    cache = new Map();
    cacheExpiry = Date.now() + CACHE_TTL_MS;
  }

  return cache;
};

/**
 * @returns {Promise<{provider, apiKey, model, source}>} resolved config.
 *   `source` is 'database' | 'environment' | 'none'. `apiKey` may be null.
 */
export const resolveProviderConfig = async (provider) => {
  const rows = await loadRows();
  const row = rows.get(provider);
  const fallback = ENV_CONFIG[provider];

  const dbKey = row?.apiKeyEncrypted ? decryptSecret(row.apiKeyEncrypted) : null;
  const envKey = fallback?.key() || null;

  const apiKey = dbKey || envKey;

  return {
    provider,
    apiKey,
    // A model chosen in the UI wins; otherwise the env default; otherwise the
    // provider decides for itself.
    model: row?.model || fallback?.model() || null,
    source: dbKey ? 'database' : envKey ? 'environment' : 'none',
  };
};

/** The provider to use: whichever is marked active, else AI_PROVIDER. */
export const resolveActiveProvider = async () => {
  const rows = await loadRows();
  for (const row of rows.values()) {
    if (row.isActive && PROVIDERS.includes(row.provider)) return row.provider;
  }
  return PROVIDERS.includes(env.AI_PROVIDER) ? env.AI_PROVIDER : 'gemini';
};

/**
 * Status of every provider, for the admin UI.
 * Contains masked hints only — never a usable key.
 */
export const listProviderStatus = async () => {
  const rows = await loadRows();
  const active = await resolveActiveProvider();

  return PROVIDERS.filter((p) => p !== 'mock' || !env.isProduction).map((provider) => {
    const row = rows.get(provider);
    const config = ENV_CONFIG[provider];
    const hasDbKey = Boolean(row?.apiKeyEncrypted && decryptSecret(row.apiKeyEncrypted));
    const hasEnvKey = Boolean(config?.key());

    return {
      provider,
      isActive: provider === active,
      configured: hasDbKey || hasEnvKey,
      source: hasDbKey ? 'database' : hasEnvKey ? 'environment' : 'none',
      // Where the key came from the environment we show no hint at all: the
      // value is not ours to reveal, even partially.
      apiKeyHint: hasDbKey ? row.apiKeyHint : null,
      model: row?.model || config?.model() || null,
      envKeyName: config?.keyName ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
};

/** Stores an API key, encrypted. Returns the masked hint. */
export const saveApiKey = async (provider, apiKey, userId) => {
  if (!isEncryptionAvailable()) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is not configured on the server');
  }

  const trimmed = apiKey.trim();
  const hint = maskSecret(trimmed);

  await AiProviderSetting.upsert({
    provider,
    apiKeyEncrypted: encryptSecret(trimmed),
    apiKeyHint: hint,
    updatedBy: userId,
  });

  invalidateCache();
  return hint;
};

export const clearApiKey = async (provider, userId) => {
  await AiProviderSetting.upsert({
    provider,
    apiKeyEncrypted: null,
    apiKeyHint: null,
    updatedBy: userId,
  });
  invalidateCache();
};

export const saveModel = async (provider, model, userId) => {
  await AiProviderSetting.upsert({ provider, model: model || null, updatedBy: userId });
  invalidateCache();
};

/**
 * Marks one provider active. Done in a transaction because the partial unique
 * index would otherwise reject the second row while the first is still active.
 */
export const setActiveProvider = async (provider, userId) => {
  await AiProviderSetting.sequelize.transaction(async (transaction) => {
    await AiProviderSetting.update(
      { isActive: false },
      { where: { isActive: true }, transaction }
    );

    const [row] = await AiProviderSetting.findOrCreate({
      where: { provider },
      defaults: { provider, updatedBy: userId },
      transaction,
    });

    await row.update({ isActive: true, updatedBy: userId }, { transaction });
  });

  invalidateCache();
};

export default {
  PROVIDERS,
  resolveProviderConfig,
  resolveActiveProvider,
  listProviderStatus,
  saveApiKey,
  clearApiKey,
  saveModel,
  setActiveProvider,
  invalidateCache,
  envKeyName,
};
