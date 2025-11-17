import Post from "../models/Post.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

class AdminController {
  // Get all reports
  async getReports(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const query = {};
      if (status) query.status = status;

      const reports = await Report.find(query)
        .populate("post", "title category status")
        .populate("reporter", "username email")
        .populate("reviewedBy", "username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Report.countDocuments(query);

      res.json({
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Review a report
  async reviewReport(req, res, next) {
    try {
      const { reportId } = req.params;
      const { status, reviewNotes, action } = req.body;

      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      report.status = status || "reviewed";
      report.reviewNotes = reviewNotes;
      report.reviewedBy = req.user.id;
      await report.save();

      // Handle post actions
      if (action && report.post) {
        const post = await Post.findById(report.post);

        if (post) {
          if (action === "hide") {
            post.status = "closed";
            await post.save();
          } else if (action === "delete") {
            await Post.findByIdAndDelete(report.post);
          }
        }
      }

      res.json({
        message: "Report reviewed successfully",
        report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all posts (admin view)
  async getAllPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, status, category } = req.query;

      const query = {};
      if (status) query.status = status;
      if (category) query.category = category;

      const posts = await Post.find(query)
        .populate("author", "username email fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Post.countDocuments(query);

      res.json({
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Block/Unblock user
  async toggleBlockUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isBlocked = !user.isBlocked;
      await user.save();

      res.json({
        message: `User ${
          user.isBlocked ? "blocked" : "unblocked"
        } successfully`,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete post (admin)
  async deletePost(req, res, next) {
    try {
      const { postId } = req.params;

      const post = await Post.findByIdAndDelete(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Delete associated comments and reports
      await Comment.deleteMany({ post: postId });
      await Report.deleteMany({ post: postId });

      res.json({ message: "Post and associated data deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Hide post
  async hidePost(req, res, next) {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.status = "closed";
      await post.save();

      res.json({
        message: "Post hidden successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStatistics(req, res, next) {
    try {
      // Total users
      const totalUsers = await User.countDocuments();
      const blockedUsers = await User.countDocuments({ isBlocked: true });

      // Active users (users who posted or commented in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsersPosts = await Post.distinct("author", {
        createdAt: { $gte: thirtyDaysAgo },
      });

      const activeUsersComments = await Comment.distinct("author", {
        createdAt: { $gte: thirtyDaysAgo },
      });

      const activeUsers = new Set([
        ...activeUsersPosts,
        ...activeUsersComments,
      ]);

      // Post statistics
      const totalPosts = await Post.countDocuments();
      const availablePosts = await Post.countDocuments({ status: "available" });
      const donatedPosts = await Post.countDocuments({ status: "donated" });
      const pendingPosts = await Post.countDocuments({ status: "pending" });

      // Category statistics
      const categoryStats = await Post.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Successful donations by category
      const donationsByCategory = await Post.aggregate([
        {
          $match: { status: "donated" },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Most shared categories (highest reaction count)
      const mostSharedCategories = await Post.aggregate([
        {
          $project: {
            category: 1,
            reactionCount: { $size: "$reactions" },
          },
        },
        {
          $group: {
            _id: "$category",
            totalReactions: { $sum: "$reactionCount" },
            postCount: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id",
            totalReactions: 1,
            postCount: 1,
            avgReactions: { $divide: ["$totalReactions", "$postCount"] },
          },
        },
        {
          $sort: { avgReactions: -1 },
        },
      ]);

      // Report statistics
      const totalReports = await Report.countDocuments();
      const pendingReports = await Report.countDocuments({ status: "pending" });
      const resolvedReports = await Report.countDocuments({
        status: "resolved",
      });

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentPosts = await Post.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });

      const recentDonations = await Post.countDocuments({
        status: "donated",
        updatedAt: { $gte: sevenDaysAgo },
      });

      res.json({
        users: {
          total: totalUsers,
          active: activeUsers.size,
          blocked: blockedUsers,
        },
        posts: {
          total: totalPosts,
          available: availablePosts,
          donated: donatedPosts,
          pending: pendingPosts,
        },
        categories: {
          distribution: categoryStats,
          donationsByCategory,
          mostSharedCategories,
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
        },
        recentActivity: {
          postsLastWeek: recentPosts,
          donationsLastWeek: recentDonations,
        },
        successfulDonations: donatedPosts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const query = {};
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
