import { createOpenAICompatibleProvider } from './openaiProvider.js';

/**
 * Groq — OpenAI-compatible API, so it reuses the OpenAI client with a different
 * base URL. No additional dependency.
 *
 * Groq's appeal here is latency and a free tier; the trade-off is that model
 * names are retired more often than OpenAI's, which is exactly why the settings
 * page lists them live from the provider rather than from a hardcoded array.
 */
export default createOpenAICompatibleProvider({
  name: 'groq',
  baseURL: 'https://api.groq.com/openai/v1',
});
