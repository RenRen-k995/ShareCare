import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";
import {
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
} from "../config/cloudinary.js";
import Post from "../models/Post.js";
import { Message } from "../models/Chat.js";

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

class AuthService {
  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const existingUsername = await UserRepository.findByUsername(
      userData.username
    );
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    const user = await UserRepository.create(userData);
    const token = this.generateToken(user._id);

    return {
      user: user.toPublicJSON(),
      token,
    };
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user._id);

    return {
      user: user.toPublicJSON(),
      token,
    };
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // UPDATED: Added username uniqueness check
  async updateProfile(userId, updateData) {
    // Don't allow password updates through this method
    delete updateData.password;
    delete updateData.isAdmin;

    // If username is being updated, check for uniqueness
    if (updateData.username) {
      const existingUser = await UserRepository.findByUsername(
        updateData.username
      );
      // If user exists AND it's not the current user (comparing IDs)
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error("Username is already taken");
      }
    }

    // If avatar is being updated, delete old avatar from Cloudinary
    if (updateData.avatar) {
      const currentUser = await UserRepository.findById(userId);
      if (
        currentUser &&
        currentUser.avatar &&
        currentUser.avatar !== updateData.avatar
      ) {
        await deleteFromCloudinary(currentUser.avatar);
      }
    }

    const user = await UserRepository.update(userId, updateData);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  async changeEmail(userId, newEmail, password) {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    const existingUser = await UserRepository.findByEmail(newEmail);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("Email is already in use");
    }

    user.email = newEmail;
    await user.save();

    return user;
  }

  async deleteAccount(userId, password) {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password before deletion
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Incorrect password");
    }

    // Collect all images to delete from Cloudinary
    const imagesToDelete = [];

    // 1. Delete user avatar
    if (user.avatar) {
      imagesToDelete.push(user.avatar);
    }

    // 2. Find and delete all posts by this user
    const userPosts = await Post.find({ author: userId });
    for (const post of userPosts) {
      // Cover image
      if (post.image) imagesToDelete.push(post.image);

      // Content images array
      if (post.contentImages && post.contentImages.length > 0) {
        imagesToDelete.push(...post.contentImages);
      }

      // Extract images from description HTML (RichTextEditor content)
      const descriptionImages = extractCloudinaryImagesFromHTML(
        post.description
      );
      if (descriptionImages.length > 0) {
        imagesToDelete.push(...descriptionImages);
      }
    }

    // 3. Find and delete all chat messages with files by this user
    const userMessages = await Message.find({
      sender: userId,
      fileUrl: { $exists: true, $ne: null },
    });
    for (const message of userMessages) {
      if (message.fileUrl) {
        imagesToDelete.push(message.fileUrl);
      }
    }

    // Delete all images from Cloudinary
    if (imagesToDelete.length > 0) {
      await deleteMultipleFromCloudinary(imagesToDelete);
    }

    // Delete user's posts
    await Post.deleteMany({ author: userId });

    // Delete user's messages (or you can keep them with anonymized sender)
    // await Message.deleteMany({ sender: userId });

    // Delete the user account
    await UserRepository.delete(userId);

    return { message: "Account deleted successfully" };
  }
}

export default new AuthService();
