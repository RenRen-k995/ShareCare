import express from 'express';
import CommentController from '../controllers/CommentController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter, commentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected
router.post('/', commentLimiter, authenticate, CommentController.createComment);
router.get('/post/:postId', apiLimiter, CommentController.getCommentsByPost);
router.put('/:id', apiLimiter, authenticate, CommentController.updateComment);
router.delete('/:id', apiLimiter, authenticate, CommentController.deleteComment);

export default router;
