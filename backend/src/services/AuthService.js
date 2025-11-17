import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository.js';

class AuthService {
  async register(userData) {
    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await UserRepository.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Create new user
    const user = await UserRepository.create(userData);
    
    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  async login(email, password) {
    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: user.toPublicJSON(),
      token
    };
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(userId, updateData) {
    // Don't allow password updates through this method
    delete updateData.password;
    delete updateData.isAdmin;

    const user = await UserRepository.update(userId, updateData);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

export default new AuthService();
