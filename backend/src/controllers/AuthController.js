import AuthService from '../services/AuthService.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, fullName } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      const result = await AuthService.register({ username, email, password, fullName });
      
      res.status(201).json({
        message: 'User registered successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);

      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { fullName, bio, avatar } = req.body;
      const updateData = {};

      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;

      const user = await AuthService.updateProfile(req.user.id, updateData);
      
      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
