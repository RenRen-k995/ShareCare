import PostService from "../services/PostService.js";
import AuthService from "../services/AuthService.js"; // Import AuthService

class PostController {
  async createPost(req, res, next) {
    try {
      const { title, description, category } = req.body;

      if (!title || !description || !category) {
        return res
          .status(400)
          .json({ message: "Title, description, and category are required" });
      }

      const postData = { title, description, category };

      // Add image if uploaded (supports both local and Cloudinary storage)
      if (req.file) {
        postData.image = req.file.cloudinaryUrl || `/uploads/${req.file.filename}`;
      }

      const post = await PostService.createPost(postData, req.user.id);

      res.status(201).json({
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPost(req, res, next) {
    try {
      let userId = null;

      // Check if user is already authenticated (via middleware)
      if (req.user) {
        userId = req.user.id;
      }
      // If not, check for token in headers manually (since this is a public route)
      else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = AuthService.verifyToken(token);
          userId = decoded.id;
        } catch (err) {
          // Token invalid or expired - treat as guest, don't crash
          console.log("Optional auth failed for view count:", err.message);
        }
      }

      const post = await PostService.getPostById(req.params.id, userId);
      res.json({ post });
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    try {
      const { title, description, category, status } = req.body;
      const updateData = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (status !== undefined) updateData.status = status;

      if (req.file) {
        updateData.image = req.file.cloudinaryUrl || `/uploads/${req.file.filename}`;
      }

      const post = await PostService.updatePost(
        req.params.id,
        updateData,
        req.user.id
      );

      res.json({
        message: "Post updated successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const result = await PostService.deletePost(
        req.params.id,
        req.user.id,
        req.user.isAdmin
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPosts(req, res, next) {
    try {
      const {
        category,
        status,
        search,
        author,
        page = 1,
        limit = 10,
        sort = "-createdAt",
      } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (author) filters.author = author;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
      };

      const result = await PostService.getPosts(filters, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePostStatus(req, res, next) {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const post = await PostService.updatePostStatus(
        req.params.id,
        status,
        req.user.id
      );

      res.json({
        message: "Post status updated successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleReaction(req, res, next) {
    try {
      const { type = "like" } = req.body;
      const post = await PostService.toggleReaction(
        req.params.id,
        req.user.id,
        type
      );

      res.json({
        message: "Reaction toggled successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const options = { page: parseInt(page), limit: parseInt(limit) };

      const result = await PostService.getUserPosts(
        req.params.userId || req.user.id,
        options
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Use Cloudinary URL if available, otherwise fallback to local URL
      let imageUrl;
      if (req.file.cloudinaryUrl) {
        imageUrl = req.file.cloudinaryUrl;
      } else {
        const baseUrl = process.env.API_URL || "http://localhost:5000";
        imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PostController();
