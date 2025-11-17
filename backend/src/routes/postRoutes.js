import express from 'express';
import PostController from '../controllers/PostController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', PostController.getPosts);
router.get('/:id', PostController.getPost);

// Protected routes
router.post('/', authenticate, upload.single('image'), PostController.createPost);
router.put('/:id', authenticate, upload.single('image'), PostController.updatePost);
router.delete('/:id', authenticate, PostController.deletePost);
router.patch('/:id/status', authenticate, PostController.updatePostStatus);
router.post('/:id/reaction', authenticate, PostController.toggleReaction);
router.get('/user/:userId', PostController.getUserPosts);

export default router;
