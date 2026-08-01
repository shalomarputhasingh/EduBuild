/**
 * Live model catalogues, fetched from each provider using the configured key.
 *
 * Nothing here is a hardcoded model list. Providers add, rename and retire
 * models constantly, and a baked-in list goes stale silently — the symptom is
 * a 404 from a model that was fine last month. Asking the provider is the only
 * way to stay current.
 *
 * Every fetch is time-boxed and cached. A failure returns a reason for the UI
 * rather than throwing, so a listing problem never blocks configuration.
 */

const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000;

/** `${provider}:${keyFingerprint}` -> { value, expiresAt } */
const cache = new Map();

export const clearModelCache = () => cache.clear();

/**
 * Cache per key, not per provider — swapping in a different key should
 * re-query rather than show the previous account's models. The fingerprint is
 * a slice of the key, never stored or returned.
 */
const cacheKeyFor = (provider, apiKey) => `${provider}:${(apiKey || '').slice(-8)}`;

const readCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
};

const writeCache = (key, value) => cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

/** fetch with a timeout, returning parsed JSON or throwing a tagged error. */
const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

    if (!response.ok) {
      const error = new Error(`Provider returned ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

// ─── Per-provider fetchers ───────────────────────────────────────────────────

/**
 * OpenAI's /v1/models lists everything on the account — embeddings, audio,
 * image models included — with no capability field to filter on. Excluding
 * known non-chat families (rather than allowlisting chat ones) means a newly
 * released chat model shows up without a code change.
 */
const NON_CHAT_PATTERNS = [
  'embedding', 'tts', 'whisper', 'dall-e', 'moderation', 'audio',
  'realtime', 'transcribe', 'image', 'search', 'similarity', 'edit',
  'davinci', 'babbage', 'curie', 'ada', 'sora', 'codex-mini',
];

const looksLikeChatModel = (id) => {
  const lower = id.toLowerCase();
  return !NON_CHAT_PATTERNS.some((pattern) => lower.includes(pattern));
};

const fetchOpenAiCompatible = async (baseUrl, apiKey) => {
  const data = await fetchJson(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });

  return (data.data || [])
    .filter((model) => model?.id && looksLikeChatModel(model.id))
    .map((model) => ({
      id: model.id,
      label: model.id,
      // Groq marks retired models inactive; OpenAI omits the field entirely.
      deprecated: model.active === false,
    }));
};

const fetchGemini = async (apiKey) => {
  // Gemini authenticates model listing with a header rather than a query
  // parameter, which keeps the key out of any URL that might get logged.
  const data = await fetchJson('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': apiKey, Accept: 'application/json' },
  });

  return (data.models || [])
    // supportedGenerationMethods is authoritative here: only models that can
    // actually answer a chat request are usable by this app.
    .filter((model) => model?.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => {
      const id = String(model.name || '').replace(/^models\//, '');
      return {
        id,
        label: model.displayName || id,
        description: model.description || null,
      };
    })
    .filter((model) => model.id);
};

const fetchOpenRouter = async (apiKey) => {
  // OpenRouter's catalogue is public, but sending the key returns the models
  // actually available to that account.
  const data = await fetchJson('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } : { Accept: 'application/json' },
  });

  return (data.data || [])
    .filter((model) => model?.id)
    .map((model) => {
      const promptPrice = Number(model.pricing?.prompt ?? 0);
      const completionPrice = Number(model.pricing?.completion ?? 0);
      const isFree = promptPrice === 0 && completionPrice === 0;

      return {
        id: model.id,
        label: model.name || model.id,
        description: model.description ? String(model.description).slice(0, 160) : null,
        free: isFree,
        contextLength: model.context_length || null,
      };
    })
    // Free models first — this project is explicitly free-first — then by name.
    .sort((a, b) => (a.free === b.free ? a.label.localeCompare(b.label) : a.free ? -1 : 1));
};

const FETCHERS = {
  openai: (apiKey) => fetchOpenAiCompatible('https://api.openai.com/v1', apiKey),
  groq: (apiKey) => fetchOpenAiCompatible('https://api.groq.com/openai/v1', apiKey),
  gemini: fetchGemini,
  openrouter: fetchOpenRouter,
  mock: async () => [{ id: 'mock-model', label: 'Mock model (no provider call)' }],
};

/**
 * @returns {Promise<{models: Array, error: string|null}>}
 *   Never throws — the UI needs a reason it can display, not an exception.
 */
export const fetchModels = async (provider, apiKey, { force = false } = {}) => {
  const fetcher = FETCHERS[provider];
  if (!fetcher) return { models: [], error: `Unknown provider "${provider}".` };

  if (provider !== 'mock' && provider !== 'openrouter' && !apiKey) {
    return { models: [], error: 'Add an API key first to load this provider’s models.' };
  }

  const key = cacheKeyFor(provider, apiKey);
  if (!force) {
    const cached = readCache(key);
    if (cached) return { models: cached, error: null };
  }

  try {
    const models = await fetcher(apiKey);
    writeCache(key, models);
    return { models, error: null };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { models: [], error: 'The provider took too long to respond. Try again.' };
    }
    if (error.status === 401 || error.status === 403) {
      return { models: [], error: 'That API key was rejected by the provider.' };
    }
    if (error.status === 429) {
      return { models: [], error: 'The provider is rate limiting requests. Try again shortly.' };
    }

    // Log for the operator, return something a human can act on.
    console.error(`[ai] Could not list models for ${provider}:`, error.message);
    return { models: [], error: 'Could not reach the provider to list models.' };
  }
};

export default { fetchModels, clearModelCache };
