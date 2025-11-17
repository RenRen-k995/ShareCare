import PostRepository from '../repositories/PostRepository.js';

class PostService {
  async createPost(postData, authorId) {
    const post = await PostRepository.create({
      ...postData,
      author: authorId
    });
    return post;
  }

  async getPostById(postId) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Increment view count
    await PostRepository.incrementViewCount(postId);
    
    return post;
  }

  async updatePost(postId, updateData, userId) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is the author
    if (post.author._id.toString() !== userId) {
      throw new Error('You are not authorized to update this post');
    }

    // Don't allow changing author
    delete updateData.author;
    delete updateData.reactions;

    const updatedPost = await PostRepository.update(postId, updateData);
    return updatedPost;
  }

  async deletePost(postId, userId, isAdmin = false) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is the author or admin
    if (post.author._id.toString() !== userId && !isAdmin) {
      throw new Error('You are not authorized to delete this post');
    }

    await PostRepository.delete(postId);
    return { message: 'Post deleted successfully' };
  }

  async getPosts(filters = {}, options = {}) {
    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.author) {
      query.author = filters.author;
    }

    if (filters.search) {
      return await PostRepository.search(filters.search, query, options);
    }

    return await PostRepository.findAll(query, options);
  }

  async updatePostStatus(postId, status, userId) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user is the author
    if (post.author._id.toString() !== userId) {
      throw new Error('You are not authorized to update this post status');
    }

    const updatedPost = await PostRepository.update(postId, { status });
    return updatedPost;
  }

  async toggleReaction(postId, userId, reactionType = 'like') {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user already reacted
    const existingReaction = post.reactions.find(
      r => r.user.toString() === userId
    );

    let updatedPost;
    if (existingReaction) {
      // Remove reaction
      updatedPost = await PostRepository.removeReaction(postId, userId);
    } else {
      // Add reaction
      updatedPost = await PostRepository.addReaction(postId, userId, reactionType);
    }

    return updatedPost;
  }

  async getUserPosts(userId, options = {}) {
    return await PostRepository.findByAuthor(userId, options);
  }
}

export default new PostService();
