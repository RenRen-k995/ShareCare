import CommentService from '../services/CommentService.js';

class CommentController {
  async createComment(req, res, next) {
    try {
      const { post, content } = req.body;

      if (!post || !content) {
        return res.status(400).json({ message: 'Post and content are required' });
      }

      const comment = await CommentService.createComment({ post, content }, req.user.id);

      res.status(201).json({
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      next(error);
    }
  }

  async getCommentsByPost(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const options = { page: parseInt(page), limit: parseInt(limit) };

      const result = await CommentService.getCommentsByPost(req.params.postId, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const comment = await CommentService.updateComment(req.params.id, { content }, req.user.id);

      res.json({
        message: 'Comment updated successfully',
        comment
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const result = await CommentService.deleteComment(req.params.id, req.user.id, req.user.isAdmin);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();
