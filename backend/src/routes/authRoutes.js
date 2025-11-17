import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with strict rate limiting
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);

// Protected routes with general rate limiting
router.get('/profile', apiLimiter, authenticate, AuthController.getProfile);
router.put('/profile', apiLimiter, authenticate, AuthController.updateProfile);

export default router;
