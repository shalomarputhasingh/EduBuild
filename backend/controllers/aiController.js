import { chat, generate, providerStatus } from '../services/ai/index.js';
import { systemPromptFor, projectHelpPrompt } from '../services/ai/prompts.js';

export const chatWithAI = async (req, res) => {
  const { message, history, language } = req.body;

  const reply = await chat({
    system: systemPromptFor(language),
    history,
    message,
  });

  const status = await providerStatus();
  res.json({ reply, provider: status.provider, model: status.model ?? null });
};

export const projectHelp = async (req, res) => {
  const { title, description, materials, concept, language } = req.body;

  const explanation = await generate({
    system: systemPromptFor(language),
    prompt: projectHelpPrompt({ title, description, materials, concept, language }),
  });

  const status = await providerStatus();
  res.json({ explanation, provider: status.provider, model: status.model ?? null });
};
