import express from 'express';
import {
  submitFeedback,
  getProjectFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimits.js';
import { submitFeedbackSchema, projectIdParam } from '../schemas/feedbackSchemas.js';
import { idParam } from '../schemas/common.js';

const router = express.Router();

router.post(
  '/',
  auth,
  writeLimiter,
  validate({ body: submitFeedbackSchema }),
  asyncHandler(submitFeedback)
);

router.get(
  '/project/:projectId',
  validate({ params: projectIdParam }),
  asyncHandler(getProjectFeedback)
);

router.delete('/:id', auth, validate({ params: idParam }), asyncHandler(deleteFeedback));

export default router;
