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
  if (!clients.has(apiKey)) clients.set(apiKey, new GoogleGenerativeAI(apiKey));
  return clients.get(apiKey);
};

const run = async (config, systemInstruction, task) => {
  const chain = config?.model ? [config.model] : DEFAULT_MODEL_CHAIN;
  let lastError;

  for (const modelName of chain) {
    try {
      const model = getClient(config.apiKey).getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      return await task(model);
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

  async chat({ system, history = [], message, config }) {
    return run(config, system, async (model) => {
      const chat = model.startChat({
        history: history.map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        })),
      });
      const result = await chat.sendMessage(message);
      return result.response.text();
    });
  },

  async generate({ system, prompt, config }) {
    return run(config, system, async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  },
};
