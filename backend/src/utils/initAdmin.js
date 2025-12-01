import User from "../models/User.js";

/**
 * Initialize admin user if no admin exists in the database.
 * This runs automatically when the server starts.
 *
 * Default admin credentials (CHANGE IN PRODUCTION):
 * - Email: admin@sharecare.com
 * - Password: Admin@123456
 */
async function initializeAdmin() {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ isAdmin: true });

    if (adminExists) {
      console.log("✅ Admin user already exists");
      return;
    }

    // No admin exists, create default admin
    console.log("⚠️  No admin user found, creating default admin...");

    const defaultAdmin = new User({
      username: "admin",
      email: "admin@sharecare.com",
      password: "Admin@123456", // This will be hashed by the User model's pre-save hook
      fullName: "System Administrator",
      isAdmin: true,
      bio: "ShareCare System Administrator",
    });

    await defaultAdmin.save();

    console.log("=".repeat(50));
    console.log("🔐 DEFAULT ADMIN USER CREATED");
    console.log("=".repeat(50));
    console.log("   Email:    admin@sharecare.com");
    console.log("   Password: Admin@123456");
    console.log("   ⚠️  CHANGE THESE CREDENTIALS IN PRODUCTION!");
    console.log("=".repeat(50));
  } catch (error) {
    // If error is due to duplicate key (admin already exists), ignore it
    if (error.code === 11000) {
      console.log("✅ Admin user already exists");
      return;
    }
    console.error("❌ Error initializing admin:", error.message);
  }
}

export default initializeAdmin;
