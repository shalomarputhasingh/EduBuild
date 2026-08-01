import { env } from '../../config/env.js';
import { ApiError } from '../../api/respond.js';
import geminiProvider from './geminiProvider.js';
import openaiProvider from './openaiProvider.js';
import groqProvider from './groqProvider.js';
import openrouterProvider from './openrouterProvider.js';
import mockProvider from './mockProvider.js';
import { resolveActiveProvider, resolveProviderConfig, envKeyName } from './settingsStore.js';

/**
 * Provider dispatch.
 *
 * Every provider exports the same four members — name, isConfigured, chat,
 * generate — so the controller never branches on which one is active, and
 * adding a fifth means adding one file and one map entry.
 *
 * Which provider runs, with which key and model, is resolved per request from
 * the admin settings (falling back to environment variables), so a change in
 * the settings page takes effect without a redeploy.
 */
const PROVIDERS = {
  gemini: geminiProvider,
  openai: openaiProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
  mock: mockProvider,
};

let warnedAboutFallback = false;

/**
 * Resolves the provider and its configuration.
 *
 * In production a missing key is a configuration error, surfaced as 503 — it is
 * better for an operator to see that immediately than for teachers to receive
 * canned text that reads like a real answer.
 *
 * In development it falls back to the mock provider so the UI works offline.
 *
 * @returns {Promise<{provider, config}>}
 */
export const resolveProvider = async () => {
  const name = await resolveActiveProvider();
  const provider = PROVIDERS[name];

  if (!provider) {
    throw new ApiError(
      503,
      `The configured AI provider is not recognised. Valid options: ${Object.keys(PROVIDERS).join(', ')}.`,
      'AI_PROVIDER_UNKNOWN'
    );
  }

  if (name === 'mock') return { provider: mockProvider, config: {} };

  const config = await resolveProviderConfig(name);

  if (provider.isConfigured(config)) return { provider, config };

  if (env.isProduction) {
    throw new ApiError(
      503,
      `The AI assistant is not configured. An administrator can add a ${name} API key in Settings, ` +
        `or set ${envKeyName(name)} on the server.`,
      'AI_NOT_CONFIGURED'
    );
  }

  if (!warnedAboutFallback) {
    console.warn(
      `[ai] No API key for "${name}" — using the mock provider. ` +
        'Add one in Settings, or set the environment variable. This fallback does not apply in production.'
    );
    warnedAboutFallback = true;
  }

  return { provider: mockProvider, config: {} };
};

/**
 * Runs a provider call with a timeout and normalized errors.
 *
 * Provider SDKs each fail differently — some throw with a `status`, some embed
 * the code in the message. Normalizing here means the controller and the client
 * see one consistent shape whichever provider is active.
 */
const withTimeout = async (operation, args) => {
  const { provider, config } = await resolveProvider();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

  try {
    return await provider[operation]({ ...args, config, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(504, 'The AI assistant took too long to respond. Please try again.', 'AI_TIMEOUT');
    }

    const status = error?.status ?? error?.response?.status;
    const message = String(error?.message || '');

    if (status === 429 || /quota|rate.?limit/i.test(message)) {
      throw new ApiError(
        429,
        'The AI assistant has hit its usage limit. Please try again in a few minutes.',
        'AI_RATE_LIMITED'
      );
    }

    if (status === 401 || status === 403) {
      // Log for the operator; tell the user nothing about the credential.
      console.error(`[ai] ${provider.name} rejected the API key (status ${status})`);
      throw new ApiError(
        503,
        'The AI assistant is not available right now. An administrator should check the API key in Settings.',
        'AI_AUTH_FAILED'
      );
    }

    console.error(`[ai] ${provider.name} ${operation} failed:`, message);
    throw new ApiError(502, 'The AI assistant could not answer that. Please try again.', 'AI_UPSTREAM_ERROR');
  } finally {
    clearTimeout(timer);
  }
};

export const chat = (args) => withTimeout('chat', args);
export const generate = (args) => withTimeout('generate', args);

/**
 * Sends a minimal prompt to verify a key and model actually work.
 * Used by the "Test connection" button in Settings.
 */
export const testProvider = async (name, config) => {
  const provider = PROVIDERS[name];
  if (!provider) return { ok: false, error: `Unknown provider "${name}".` };
  if (!provider.isConfigured(config)) return { ok: false, error: 'No API key is configured.' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

  try {
    const reply = await provider.generate({
      system: 'You are a test harness. Reply with exactly: OK',
      prompt: 'Reply with exactly: OK',
      config,
      signal: controller.signal,
    });
    return { ok: true, sample: String(reply).slice(0, 200) };
  } catch (error) {
    if (controller.signal.aborted) return { ok: false, error: 'The provider timed out.' };

    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) return { ok: false, error: 'The provider rejected this API key.' };
    if (status === 429) return { ok: false, error: 'Rate limited by the provider. Try again shortly.' };
    if (status === 404) return { ok: false, error: 'That model was not found for this account.' };

    return { ok: false, error: 'Could not reach the provider.' };
  } finally {
    clearTimeout(timer);
  }
};

/** For the health endpoint. Reports configuration state, never a key. */
export const providerStatus = async () => {
  const name = await resolveActiveProvider();
  const provider = PROVIDERS[name];

  if (!provider || name === 'mock') {
    return { provider: name, known: Boolean(provider), configured: Boolean(provider) };
  }

  const config = await resolveProviderConfig(name);
  return {
    provider: name,
    known: true,
    configured: provider.isConfigured(config),
    source: config.source,
    model: config.model,
  };
};

export default { resolveProvider, chat, generate, providerStatus, testProvider, PROVIDERS };
