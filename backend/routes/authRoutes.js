import express from 'express';
import { signup, signin, getProfile } from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimits.js';
import { signupSchema, signinSchema } from '../schemas/authSchemas.js';

const router = express.Router();

router.post('/signup', authLimiter, validate({ body: signupSchema }), asyncHandler(signup));
router.post('/signin', authLimiter, validate({ body: signinSchema }), asyncHandler(signin));
router.get('/profile', auth, asyncHandler(getProfile));

export default router;
