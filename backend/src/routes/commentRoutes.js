import express from 'express';
import CommentController from '../controllers/CommentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.post('/', authenticate, CommentController.createComment);
router.get('/post/:postId', CommentController.getCommentsByPost);
router.put('/:id', authenticate, CommentController.updateComment);
router.delete('/:id', authenticate, CommentController.deleteComment);

export default router;
