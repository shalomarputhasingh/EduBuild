import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Google Gemini.
 *
 * The fallback chain is deliberate rather than defensive clutter: Gemini's free
 * tier returns 429 readily, and individual model names are retired without much
 * notice. Walking a list keeps the assistant working through both.
 *
 * Choosing a model in the admin settings page pins it and skips the chain.
 */
const DEFAULT_MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
const MAX_CACHED_CLIENTS = 3;

/** Errors worth retrying on the next model rather than surfacing immediately. */
const shouldTryNextModel = (error) => {
  const message = String(error?.message || '');
  const status = error?.status;
  return (
    status === 429 ||
    status === 404 ||
    /\b(429|404|503)\b/.test(message) ||
    /quota|rate.?limit|not found|unavailable|overloaded/i.test(message)
  );
};

// One client per key, rebuilt when an admin changes the key.
const clients = new Map();
const getClient = (apiKey) => {
  if (!clients.has(apiKey)) {
    // Keys can be rotated through Settings; do not retain every historical
    // credential in process memory.
    if (clients.size >= MAX_CACHED_CLIENTS) clients.delete(clients.keys().next().value);
    clients.set(apiKey, new GoogleGenerativeAI(apiKey));
  }
  return clients.get(apiKey);
};

const abortable = async (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
};

const run = async (config, systemInstruction, task, signal) => {
  const chain = config?.model ? [config.model] : DEFAULT_MODEL_CHAIN;
  let lastError;

  for (const modelName of chain) {
    try {
      const model = getClient(config.apiKey).getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      return await abortable(task(model), signal);
    } catch (error) {
      if (shouldTryNextModel(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('No Gemini model was available');
};

export default {
  name: 'gemini',

  isConfigured: (config) => Boolean(config?.apiKey),

  async chat({ system, history = [], message, config, signal }) {
    return run(config, system, async (model) => {
      const chat = model.startChat({
        history: history.map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        })),
      });
      const result = await chat.sendMessage(message);
      return result.response.text();
    }, signal);
  },

  async generate({ system, prompt, config, signal }) {
    return run(config, system, async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }, signal);
  },
};
