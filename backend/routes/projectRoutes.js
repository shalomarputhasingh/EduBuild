import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  getRelatedProjects,
} from '../controllers/projectController.js';
import { getRecommendedProjects } from '../controllers/recommendationController.js';
import auth from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';
import adminOnly from '../middleware/adminOnly.js';
import validate from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimits.js';
import { projectQuerySchema } from '../schemas/projectQuerySchema.js';
import {
  createProjectSchema,
  updateProjectSchema,
  updateStatusSchema,
} from '../schemas/projectSchemas.js';
import { idParam } from '../schemas/common.js';

const router = express.Router();

// Static paths must be declared before /:id, or "recommended" is read as an id.
router.get('/recommended', auth, asyncHandler(getRecommendedProjects));

router.get(
  '/',
  optionalAuth,
  validate({ query: projectQuerySchema }),
  asyncHandler(getAllProjects)
);

router.get('/:id', optionalAuth, validate({ params: idParam }), asyncHandler(getProjectById));
router.get(
  '/:id/related',
  optionalAuth,
  validate({ params: idParam }),
  asyncHandler(getRelatedProjects)
);

router.post(
  '/',
  auth,
  writeLimiter,
  validate({ body: createProjectSchema }),
  asyncHandler(createProject)
);

router.put(
  '/:id',
  auth,
  writeLimiter,
  validate({ params: idParam, body: updateProjectSchema }),
  asyncHandler(updateProject)
);

router.patch(
  '/:id/status',
  auth,
  adminOnly,
  validate({ params: idParam, body: updateStatusSchema }),
  asyncHandler(updateProjectStatus)
);

router.delete(
  '/:id',
  auth,
  writeLimiter,
  validate({ params: idParam }),
  asyncHandler(deleteProject)
);

export default router;
