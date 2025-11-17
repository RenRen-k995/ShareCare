import CommentRepository from '../repositories/CommentRepository.js';
import PostRepository from '../repositories/PostRepository.js';

class CommentService {
  async createComment(commentData, authorId) {
    // Verify post exists
    const post = await PostRepository.findById(commentData.post);
    if (!post) {
      throw new Error('Post not found');
    }

    const comment = await CommentRepository.create({
      ...commentData,
      author: authorId
    });

    return comment;
  }

  async getCommentsByPost(postId, options = {}) {
    // Verify post exists
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    return await CommentRepository.findByPost(postId, options);
  }

  async updateComment(commentId, updateData, userId) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author
    if (comment.author._id.toString() !== userId) {
      throw new Error('You are not authorized to update this comment');
    }

    const updatedComment = await CommentRepository.update(commentId, updateData);
    return updatedComment;
  }

  async deleteComment(commentId, userId, isAdmin = false) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author or admin
    if (comment.author._id.toString() !== userId && !isAdmin) {
      throw new Error('You are not authorized to delete this comment');
    }

    await CommentRepository.delete(commentId);
    return { message: 'Comment deleted successfully' };
  }
}

export default new CommentService();
