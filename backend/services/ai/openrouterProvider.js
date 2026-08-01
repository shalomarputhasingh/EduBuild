import { env } from '../../config/env.js';
import { createOpenAICompatibleProvider } from './openaiProvider.js';

/**
 * OpenRouter — OpenAI-compatible gateway in front of many models.
 *
 * The two extra headers are OpenRouter's attribution convention: they identify
 * the calling app in their dashboards. They carry no credentials.
 */
export default createOpenAICompatibleProvider({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': env.CLIENT_URL || 'http://localhost:5173',
    'X-Title': 'EDUBUILD',
  },
});
