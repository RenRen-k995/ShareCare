import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// Configure multer to use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and common document types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype =
    allowedTypes.test(file.mimetype) || file.mimetype.startsWith("image/");

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(
      new Error("Only images and documents (pdf, doc, docx, txt) are allowed!"),
      false
    );
  }
};

// Create multer instance for memory storage
const cloudinaryUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for files
  },
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Default folder is "sharecare", but can be overridden via options.folder
    const folder = options.folder || "sharecare";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Middleware to handle Cloudinary upload after multer processes the file
const processCloudinaryUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `${req.file.fieldname}-${uniqueSuffix}`,
    });

    // Replace file info with Cloudinary result
    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    req.file.filename = result.public_id;

    next();
  } catch (error) {
    next(error);
  }
};

// Factory function to create a Cloudinary upload processor with a custom folder
const createCloudinaryProcessor = (folder) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const result = await uploadToCloudinary(req.file.buffer, {
        folder,
        public_id: `${req.file.fieldname}-${uniqueSuffix}`,
      });

      // Replace file info with Cloudinary result
      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      req.file.filename = result.public_id;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { cloudinaryUpload, processCloudinaryUpload, uploadToCloudinary, createCloudinaryProcessor };
