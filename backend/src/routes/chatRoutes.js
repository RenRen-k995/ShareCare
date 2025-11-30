import express from "express";
import ChatController from "../controllers/ChatController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/upload.js";
import {
  cloudinaryUpload,
  uploadToCloudinary,
  generateUniqueSuffix,
} from "../middleware/cloudinaryUpload.js";

const router = express.Router();

// Check if Cloudinary is configured
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// All routes are protected
router.post("/", apiLimiter, authenticate, ChatController.getOrCreateChat);
router.get("/", apiLimiter, authenticate, ChatController.getUserChats);
router.post("/message", apiLimiter, authenticate, ChatController.sendMessage);
router.get(
  "/:chatId/messages",
  apiLimiter,
  authenticate,
  ChatController.getChatMessages
);

// Chat file upload endpoint - use Cloudinary if configured, otherwise fallback to local storage
router.post("/upload", authenticate, (req, res, next) => {
  if (useCloudinary) {
    // Use Cloudinary with memory storage
    cloudinaryUpload.single("file")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload failed", error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      try {
        // Determine folder based on file type (image vs document)
        const isImage = req.file.mimetype.startsWith("image/");
        const folder = isImage ? "sharecare/chat/images" : "sharecare/chat/files";

        const uniqueSuffix = generateUniqueSuffix();
        const result = await uploadToCloudinary(req.file.buffer, {
          folder,
          public_id: `${req.file.fieldname}-${uniqueSuffix}`,
        });

        res.json({
          fileUrl: result.secure_url,
          fileName: req.file.originalname,
          fileSize: req.file.size,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Cloudinary upload failed", error: error.message });
      }
    });
  } else {
    // Fallback to local storage
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "File upload failed", error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    });
  }
});

export default router;
