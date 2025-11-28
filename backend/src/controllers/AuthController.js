import AuthService from "../services/AuthService.js";

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ message: "Username, email, and password are required" });
      }

      const result = await AuthService.register({
        username,
        email,
        password,
        fullName,
      });

      res.status(201).json({
        message: "User registered successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const result = await AuthService.login(email, password);

      res.json({
        message: "Login successful",
        ...result,
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

  // UPDATED: Added username, gender, and dateOfBirth to update logic
  async updateProfile(req, res, next) {
    try {
      const { fullName, bio, avatar, username, gender, dateOfBirth } = req.body;
      const updateData = {};

      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (username !== undefined) updateData.username = username;
      if (gender !== undefined) updateData.gender = gender;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

      const user = await AuthService.updateProfile(req.user.id, updateData);

      res.json({
        message: "Profile updated successfully",
        user: user.toPublicJSON ? user.toPublicJSON() : user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current and new passwords are required" });
      }

      await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async changeEmail(req, res, next) {
    try {
      const { newEmail, password } = req.body;

      if (!newEmail || !password) {
        return res
          .status(400)
          .json({ message: "New email and password are required" });
      }

      const user = await AuthService.changeEmail(
        req.user.id,
        newEmail,
        password
      );

      res.json({
        message: "Email updated successfully",
        user: user.toPublicJSON ? user.toPublicJSON() : user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
