import express from "express";
import ChatController from "../controllers/ChatController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { getCloudinaryFolder } from "../utils/fileUtils.js";
import { Message } from "../models/Chat.js";

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

      // Determine the appropriate Cloudinary folder based on file type
      const folder = getCloudinaryFolder(req.file.mimetype, "chat");

      console.log("Uploading to Cloudinary:", req.file.path, "Folder:", folder);
      // Upload to Cloudinary with separate folders for images and files
      const result = await uploadToCloudinary(req.file.path, folder);
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

// Search messages in a chat
router.get("/:chatId/search", apiLimiter, authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters" });
    }

    const messages = await Message.find({
      chat: chatId,
      isDeleted: { $ne: true },
      content: { $regex: q, $options: "i" },
    })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages, query: q });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

// Link preview endpoint
router.get("/link-preview", apiLimiter, authenticate, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Basic validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ message: "Invalid URL" });
    }

    // Fetch the page and extract metadata
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ShareCare/1.0)",
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch URL");
    }

    const html = await response.text();

    // Extract Open Graph and meta tags
    const titleMatch =
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
      html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/) ||
      html.match(/<title>([^<]*)<\/title>/);

    const descriptionMatch =
      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
      html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);

    const imageMatch = html.match(
      /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/
    );

    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

    res.json({
      url,
      domain,
      title: titleMatch ? titleMatch[1] : domain,
      description: descriptionMatch ? descriptionMatch[1] : null,
      image: imageMatch ? imageMatch[1] : null,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    });
  } catch (error) {
    console.error("Link preview error:", error);
    // Return basic info even on error
    try {
      const urlObj = new URL(req.query.url);
      const domain = urlObj.hostname.replace("www.", "");
      res.json({
        url: req.query.url,
        domain,
        title: domain,
        description: null,
        image: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      });
    } catch {
      res.status(500).json({ message: "Link preview failed" });
    }
  }
});

export default router;
