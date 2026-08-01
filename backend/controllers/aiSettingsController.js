import {
  listProviderStatus,
  resolveProviderConfig,
  saveApiKey,
  clearApiKey,
  saveModel,
  setActiveProvider,
} from '../services/ai/settingsStore.js';
import { fetchModels } from '../services/ai/modelCatalog.js';
import { testProvider } from '../services/ai/index.js';
import { isEncryptionAvailable } from '../utils/crypto.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Admin-only AI configuration.
 *
 * The invariant across every handler in this file: a decrypted API key is never
 * placed in a response body. Clients receive a masked hint and a boolean, which
 * is enough to render the UI and not enough to authenticate with.
 */

export const getSettings = async (req, res) => {
  res.json({
    providers: await listProviderStatus(),
    // The UI disables key entry and explains why when this is false, rather
    // than accepting a key and silently failing to store it.
    canStoreKeys: isEncryptionAvailable(),
  });
};

export const updateApiKey = async (req, res) => {
  const { provider } = req.params;
  const { apiKey } = req.body;

  if (!isEncryptionAvailable()) {
    throw new ApiError(
      503,
      'The server cannot store API keys because SETTINGS_ENCRYPTION_KEY is not set. ' +
        'Generate one with "openssl rand -base64 32" and add it to the environment.',
      'ENCRYPTION_UNAVAILABLE'
    );
  }

  // Verify before storing. Saving a key that does not work leaves an admin
  // looking at a green "configured" badge and a broken assistant.
  const check = await testProvider(provider, { apiKey, model: req.body.model || null });
  if (!check.ok) {
    throw new ApiError(400, `That key could not be verified: ${check.error}`, 'API_KEY_REJECTED');
  }

  const apiKeyHint = await saveApiKey(provider, apiKey, req.userId);

  res.json({ message: `${provider} API key saved and verified.`, provider, apiKeyHint });
};

export const removeApiKey = async (req, res) => {
  const { provider } = req.params;
  await clearApiKey(provider, req.userId);
  res.json({ message: `${provider} API key removed.`, provider });
};

export const updateModel = async (req, res) => {
  const { provider } = req.params;
  await saveModel(provider, req.body.model, req.userId);
  res.json({
    message: req.body.model ? `Model set to ${req.body.model}.` : 'Reverted to the provider default.',
    provider,
    model: req.body.model || null,
  });
};

export const activateProvider = async (req, res) => {
  const { provider } = req.params;

  const config = await resolveProviderConfig(provider);
  if (provider !== 'mock' && !config.apiKey) {
    throw new ApiError(
      400,
      'Add an API key for this provider before making it active.',
      'PROVIDER_NOT_CONFIGURED'
    );
  }

  await setActiveProvider(provider, req.userId);
  res.json({ message: `${provider} is now the active provider.`, provider });
};

/**
 * Live model catalogue for a provider.
 *
 * Models are read from the provider's own API using the configured key, never
 * from a list baked into this codebase — providers retire and rename models
 * often enough that a hardcoded list goes stale without anyone noticing.
 */
export const getModels = async (req, res) => {
  const { provider } = req.params;
  const config = await resolveProviderConfig(provider);

  const { models, error } = await fetchModels(provider, config.apiKey, {
    force: req.query.refresh === 'true',
  });

  res.json({
    provider,
    models,
    selected: config.model,
    error,
  });
};

export const testConnection = async (req, res) => {
  const { provider } = req.params;
  const config = await resolveProviderConfig(provider);

  const result = await testProvider(provider, {
    apiKey: config.apiKey,
    model: req.body?.model || config.model,
  });

  res.status(result.ok ? 200 : 400).json({
    provider,
    ok: result.ok,
    message: result.ok ? 'The provider responded successfully.' : result.error,
    sample: result.sample ?? null,
  });
};
