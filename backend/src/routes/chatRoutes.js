import express from "express";
import ChatController from "../controllers/ChatController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

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
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("Upload request received");
      console.log("File:", req.file);
      
      if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("Uploading to Cloudinary:", req.file.path);
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.path, "chat_files");
      console.log("Cloudinary upload successful:", result.secure_url);

      res.json({
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res
        .status(500)
        .json({ message: "File upload failed", error: error.message });
    }
  }
);

export default router;
