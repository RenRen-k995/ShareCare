import AuthService from "../services/AuthService.js";
import UserRepository from "../repositories/UserRepository.js";

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = AuthService.verifyToken(token);

    // Get user from database
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

export const requireAdmin = isAdmin; // Alias for consistency
