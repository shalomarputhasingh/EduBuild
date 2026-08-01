import OpenAI from 'openai';

/**
 * OpenAI, and the shared implementation for every OpenAI-compatible provider.
 *
 * Groq and OpenRouter both speak the OpenAI chat-completions protocol, so they
 * reuse this client with a different baseURL rather than pulling in their own
 * SDKs. That is why supporting four providers added no dependencies.
 *
 * Config (`{ apiKey, model }`) arrives per call rather than at module load,
 * because an admin can change the key or model from the settings page at any
 * time and the next request must use it without a restart.
 */

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
};
const MAX_CACHED_CLIENTS = 3;

export const createOpenAICompatibleProvider = ({ name, baseURL, defaultHeaders }) => {
  // One client per key, so switching keys does not keep using a stale client
  // and repeated calls do not rebuild it on every request.
  const clients = new Map();

  const getClient = (apiKey) => {
    if (!clients.has(apiKey)) {
      // Keys may be rotated through Settings. Keep only a few active clients
      // so an old credential is not retained in this process indefinitely.
      if (clients.size >= MAX_CACHED_CLIENTS) clients.delete(clients.keys().next().value);
      clients.set(apiKey, new OpenAI({ apiKey, baseURL, defaultHeaders, maxRetries: 1 }));
    }
    return clients.get(apiKey);
  };

  const modelFor = (config) => config?.model || DEFAULT_MODELS[name];

  const toMessages = (system, history, message) => [
    { role: 'system', content: system },
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: turn.text,
    })),
    { role: 'user', content: message },
  ];

  const extract = (response) => {
    const content = response?.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${name} returned an empty response`);
    return content;
  };

  const complete = async (messages, config, signal) => {
    const response = await getClient(config.apiKey).chat.completions.create(
      { model: modelFor(config), messages, max_tokens: 1200, temperature: 0.7 },
      { signal }
    );
    return extract(response);
  };

  return {
    name,
    isConfigured: (config) => Boolean(config?.apiKey),

    chat: ({ system, history = [], message, config, signal }) =>
      complete(toMessages(system, history, message), config, signal),

    generate: ({ system, prompt, config, signal }) =>
      complete(
        [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        config,
        signal
      ),
  };
};

export default createOpenAICompatibleProvider({ name: 'openai' });
