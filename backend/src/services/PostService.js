import PostRepository from "../repositories/PostRepository.js";
import User from "../models/User.js"; // Import User model
import {
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
} from "../config/cloudinary.js";

/**
 * Extract Cloudinary image URLs from HTML content
 * @param {string} htmlContent - HTML content from RichTextEditor
 * @returns {string[]} Array of Cloudinary image URLs
 */
const extractCloudinaryImagesFromHTML = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== "string") return [];

  const imageUrls = [];
  // Match img tags with Cloudinary URLs
  const imgRegex = /<img[^>]+src="([^"]*cloudinary[^"]*)"/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      imageUrls.push(match[1]);
    }
  }

  return imageUrls;
};

class PostService {
  // ... other methods ...
  async createPost(postData, authorId) {
    const post = await PostRepository.create({
      ...postData,
      author: authorId,
    });
    return post;
  }

  async getPostById(postId, userId = null) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (userId) {
      const hasViewed = post.viewedBy && post.viewedBy.includes(userId);
      if (!hasViewed) {
        PostRepository.update(postId, {
          $inc: { viewCount: 1 },
          $addToSet: { viewedBy: userId },
        }).catch((err) => console.error("Error updating view count:", err));
        post.viewCount += 1;
      }
    }
    return post;
  }

  async updatePost(postId, updateData, userId) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.author._id.toString() !== userId) {
      throw new Error("You are not authorized to update this post");
    }

    // If updating main image, delete old one from Cloudinary
    if (updateData.image && post.image && updateData.image !== post.image) {
      await deleteFromCloudinary(post.image);
    }

    // If updating content images, delete removed ones from Cloudinary
    if (updateData.contentImages && post.contentImages) {
      const oldImages = post.contentImages.filter(
        (img) => !updateData.contentImages.includes(img)
      );
      if (oldImages.length > 0) {
        await deleteMultipleFromCloudinary(oldImages);
      }
    }

    // If updating description, find and delete removed images from HTML
    if (updateData.description && post.description) {
      const oldDescriptionImages = extractCloudinaryImagesFromHTML(
        post.description
      );
      const newDescriptionImages = extractCloudinaryImagesFromHTML(
        updateData.description
      );

      const removedImages = oldDescriptionImages.filter(
        (img) => !newDescriptionImages.includes(img)
      );

      if (removedImages.length > 0) {
        await deleteMultipleFromCloudinary(removedImages);
      }
    }

    delete updateData.author;
    delete updateData.reactions;
    const updatedPost = await PostRepository.update(postId, updateData);
    return updatedPost;
  }

  async deletePost(postId, userId, isAdmin = false) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.author._id.toString() !== userId && !isAdmin) {
      throw new Error("You are not authorized to delete this post");
    }

    // Delete images from Cloudinary before deleting post
    const imagesToDelete = [];

    // 1. Cover image
    if (post.image) imagesToDelete.push(post.image);

    // 2. Content images array (if exists)
    if (post.contentImages && post.contentImages.length > 0) {
      imagesToDelete.push(...post.contentImages);
    }

    // 3. Extract images from description HTML (RichTextEditor content)
    const descriptionImages = extractCloudinaryImagesFromHTML(post.description);
    if (descriptionImages.length > 0) {
      imagesToDelete.push(...descriptionImages);
    }

    if (imagesToDelete.length > 0) {
      await deleteMultipleFromCloudinary(imagesToDelete);
    }

    // Subtract likes from author's totalLikes before deleting
    const likesCount = post.reactions?.length || 0;
    if (likesCount > 0) {
      await User.findByIdAndUpdate(post.author._id, {
        $inc: { totalLikes: -likesCount },
      });
    }

    await PostRepository.delete(postId);
    return { message: "Post deleted successfully" };
  }

  async getPosts(filters = {}, options = {}) {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.author) query.author = filters.author;
    if (filters.search) {
      return await PostRepository.search(filters.search, query, options);
    }
    return await PostRepository.findAll(query, options);
  }

  async updatePostStatus(postId, status, userId) {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    if (post.author._id.toString() !== userId) {
      throw new Error("You are not authorized to update this post status");
    }
    const updatedPost = await PostRepository.update(postId, { status });
    return updatedPost;
  }

  async toggleReaction(postId, userId, reactionType = "like") {
    const post = await PostRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const existingReaction = post.reactions.find(
      (r) => r.user.toString() === userId
    );

    let updatedPost;
    if (existingReaction) {
      // Remove reaction
      updatedPost = await PostRepository.removeReaction(postId, userId);
      // Decrement author's totalLikes
      await User.findByIdAndUpdate(post.author._id, {
        $inc: { totalLikes: -1 },
      });
    } else {
      // Add reaction
      updatedPost = await PostRepository.addReaction(
        postId,
        userId,
        reactionType
      );
      // Increment author's totalLikes
      await User.findByIdAndUpdate(post.author._id, {
        $inc: { totalLikes: 1 },
      });
    }
    // Re-fetch to ensure author's totalLikes reflects latest value
    const fresh = await PostRepository.findById(postId);
    return fresh;
  }

  async getUserPosts(userId, options = {}) {
    return await PostRepository.findByAuthor(userId, options);
  }
}

export default new PostService();
