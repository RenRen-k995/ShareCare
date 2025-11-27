import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";

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
}

export default new AuthService();
