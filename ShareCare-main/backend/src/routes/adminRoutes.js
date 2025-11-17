import express from "express";
import AdminController from "../controllers/AdminController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Reports
router.get("/reports", AdminController.getReports);
router.patch("/reports/:reportId", AdminController.reviewReport);

// Posts management
router.get("/posts", AdminController.getAllPosts);
router.delete("/posts/:postId", AdminController.deletePost);
router.patch("/posts/:postId/hide", AdminController.hidePost);

// User management
router.get("/users", AdminController.getAllUsers);
router.patch("/users/:userId/block", AdminController.toggleBlockUser);

// Statistics
router.get("/statistics", AdminController.getStatistics);

export default router;
