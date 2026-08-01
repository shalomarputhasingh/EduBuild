import express from 'express';
import { chatWithAI, projectHelp } from '../controllers/aiController.js';
import {
  getSettings,
  updateApiKey,
  removeApiKey,
  updateModel,
  activateProvider,
  getModels,
  testConnection,
} from '../controllers/aiSettingsController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import validate from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { aiLimiter, writeLimiter } from '../middleware/rateLimits.js';
import { chatSchema, projectHelpSchema } from '../schemas/aiSchemas.js';
import {
  providerParam,
  apiKeySchema,
  modelSchema,
  testConnectionSchema,
} from '../schemas/aiSettingsSchemas.js';

const router = express.Router();

// ─── Assistant ───────────────────────────────────────────────────────────────
// Authentication is required on every AI route. These calls cost money per
// request against the server's own key; leaving them open made the endpoint a
// free proxy to a paid account.
router.post('/chat', auth, aiLimiter, validate({ body: chatSchema }), asyncHandler(chatWithAI));

router.post(
  '/project-help',
  auth,
  aiLimiter,
  validate({ body: projectHelpSchema }),
  asyncHandler(projectHelp)
);

// Previous name for /project-help. Kept so an older frontend build keeps working.
router.post(
  '/explain',
  auth,
  aiLimiter,
  validate({ body: projectHelpSchema }),
  asyncHandler(projectHelp)
);

// ─── Settings (admin only) ───────────────────────────────────────────────────
// Every handler below is gated on adminOnly. Responses carry masked hints,
// never a usable API key.
const admin = [auth, adminOnly];

router.get('/settings', ...admin, asyncHandler(getSettings));

router.get(
  '/settings/:provider/models',
  ...admin,
  validate({ params: providerParam }),
  asyncHandler(getModels)
);

router.put(
  '/settings/:provider/key',
  ...admin,
  writeLimiter,
  validate({ params: providerParam, body: apiKeySchema }),
  asyncHandler(updateApiKey)
);

router.delete(
  '/settings/:provider/key',
  ...admin,
  writeLimiter,
  validate({ params: providerParam }),
  asyncHandler(removeApiKey)
);

router.put(
  '/settings/:provider/model',
  ...admin,
  writeLimiter,
  validate({ params: providerParam, body: modelSchema }),
  asyncHandler(updateModel)
);

router.post(
  '/settings/:provider/activate',
  ...admin,
  writeLimiter,
  validate({ params: providerParam }),
  asyncHandler(activateProvider)
);

router.post(
  '/settings/:provider/test',
  ...admin,
  aiLimiter,
  validate({ params: providerParam, body: testConnectionSchema }),
  asyncHandler(testConnection)
);

export default router;
