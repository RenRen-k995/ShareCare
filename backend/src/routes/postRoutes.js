import express from "express";
import PostController from "../controllers/PostController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  cloudinaryUpload,
  processCloudinaryUpload,
} from "../middleware/cloudinaryUpload.js";
import { apiLimiter, postCreationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Check if Cloudinary is configured
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Select appropriate upload middleware based on configuration
const uploadMiddleware = useCloudinary
  ? [cloudinaryUpload.single("image"), processCloudinaryUpload]
  : [upload.single("image")];

// Public routes
router.get("/", apiLimiter, PostController.getPosts);
router.get("/:id", apiLimiter, PostController.getPost);

// Protected routes
router.post(
  "/",
  postCreationLimiter,
  authenticate,
  ...uploadMiddleware,
  PostController.createPost
);
router.post(
  "/upload-image",
  apiLimiter,
  authenticate,
  ...uploadMiddleware,
  PostController.uploadImage
);
router.put(
  "/:id",
  apiLimiter,
  authenticate,
  ...uploadMiddleware,
  PostController.updatePost
);
router.delete("/:id", apiLimiter, authenticate, PostController.deletePost);
router.patch(
  "/:id/status",
  apiLimiter,
  authenticate,
  PostController.updatePostStatus
);
router.post(
  "/:id/reaction",
  apiLimiter,
  authenticate,
  PostController.toggleReaction
);
router.get("/user/:userId", apiLimiter, PostController.getUserPosts);

export default router;
