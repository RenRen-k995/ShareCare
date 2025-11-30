import express from "express";
import AuthController from "../controllers/AuthController.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { getCloudinaryFolder } from "../utils/fileUtils.js";

const router = express.Router();

// Public routes with strict rate limiting
router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);

// Avatar upload endpoint
router.post(
  "/upload-avatar",
  apiLimiter,
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Upload to Cloudinary avatars folder
      const folder = getCloudinaryFolder(req.file.mimetype, "avatar");
      const result = await uploadToCloudinary(req.file.path, folder);

      res.json({
        avatarUrl: result.secure_url,
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  }
);

// Protected routes with general rate limiting
router.get("/profile", apiLimiter, authenticate, AuthController.getProfile);
router.put("/profile", apiLimiter, authenticate, AuthController.updateProfile);
router.post(
  "/change-password",
  apiLimiter,
  authenticate,
  AuthController.changePassword
);
router.post(
  "/change-email",
  apiLimiter,
  authenticate,
  AuthController.changeEmail
);
router.delete(
  "/account",
  apiLimiter,
  authenticate,
  AuthController.deleteAccount
);

export default router;
