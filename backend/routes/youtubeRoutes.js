import express from 'express';
import { previewVideo, searchVideos } from '../controllers/youtubeController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { youtubeLimiter } from '../middleware/rateLimits.js';
import { youtubePreviewSchema } from '../schemas/youtubeSchemas.js';

const router = express.Router();

router.post(
  '/preview',
  auth,
  youtubeLimiter,
  validate({ body: youtubePreviewSchema }),
  asyncHandler(previewVideo)
);

router.get('/search', auth, youtubeLimiter, asyncHandler(searchVideos));

export default router;
