import express from 'express';
import PostController from '../controllers/PostController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { apiLimiter, postCreationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', apiLimiter, PostController.getPosts);
router.get('/:id', apiLimiter, PostController.getPost);

// Protected routes
router.post('/', postCreationLimiter, authenticate, upload.single('image'), PostController.createPost);
router.put('/:id', apiLimiter, authenticate, upload.single('image'), PostController.updatePost);
router.delete('/:id', apiLimiter, authenticate, PostController.deletePost);
router.patch('/:id/status', apiLimiter, authenticate, PostController.updatePostStatus);
router.post('/:id/reaction', apiLimiter, authenticate, PostController.toggleReaction);
router.get('/user/:userId', apiLimiter, PostController.getUserPosts);

export default router;
