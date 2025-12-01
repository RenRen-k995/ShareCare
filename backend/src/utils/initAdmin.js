import User from "../models/User.js";

/**
 * Initialize admin user if no admin exists in the database.
 * This runs automatically when the server starts.
 *
 * Admin credentials can be configured via environment variables:
 * - ADMIN_EMAIL (default: admin@sharecare.com)
 * - ADMIN_PASSWORD (default: Admin@123456) - MUST BE CHANGED IN PRODUCTION
 * - ADMIN_USERNAME (default: admin)
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

    // Get admin credentials from environment variables or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || "admin@sharecare.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";

    const defaultAdmin = new User({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword, // This will be hashed by the User model's pre-save hook
      fullName: "System Administrator",
      isAdmin: true,
      bio: "ShareCare System Administrator",
    });

    await defaultAdmin.save();

    console.log("=".repeat(50));
    console.log("🔐 DEFAULT ADMIN USER CREATED");
    console.log("=".repeat(50));
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword.substring(0, 3)}${"*".repeat(adminPassword.length - 3)}`);
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
