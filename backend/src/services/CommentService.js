import CommentRepository from "../repositories/CommentRepository.js";
import PostRepository from "../repositories/PostRepository.js";
import Comment from "../models/Comment.js"; // Import Model
import User from "../models/User.js"; // Import User Model

class CommentService {
  async createComment(commentData, authorId) {
    const post = await PostRepository.findById(commentData.post);
    if (!post) {
      throw new Error("Post not found");
    }
    const comment = await CommentRepository.create({
      ...commentData,
      author: authorId,
    });
    return comment;
  }

  async getCommentsByPost(postId, options = {}) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    return await CommentRepository.findByPost(postId, options);
  }

  async updateComment(commentId, updateData, userId) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.author._id.toString() !== userId) {
      throw new Error("You are not authorized to update this comment");
    }
    const updatedComment = await CommentRepository.update(
      commentId,
      updateData
    );
    return updatedComment;
  }

  async deleteComment(commentId, userId, isAdmin = false) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.author._id.toString() !== userId && !isAdmin) {
      throw new Error("You are not authorized to delete this comment");
    }
    await CommentRepository.delete(commentId);
    return { message: "Comment deleted successfully" };
  }

  // NEW: Toggle like on comment
  async toggleLike(commentId, userId) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user already liked
    // Note: comment.likes is an array of ObjectIds
    const isLiked = comment.likes.some((id) => id.toString() === userId);

    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      // Decrement author's totalLikes
      await User.findByIdAndUpdate(comment.author._id, {
        $inc: { totalLikes: -1 },
      });
    } else {
      // Like
      comment.likes.push(userId);
      // Increment author's totalLikes
      await User.findByIdAndUpdate(comment.author._id, {
        $inc: { totalLikes: 1 },
      });
    }

    await comment.save();
    return comment;
  }
}

export default new CommentService();
