import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sharecare";

// Admin credentials from environment variables or defaults
// IMPORTANT: Use environment variables in production!
const getAdminCredentials = () => ({
  username: process.env.ADMIN_USERNAME || "admin",
  email: process.env.ADMIN_EMAIL || "admin@sharecare.com",
  password: process.env.ADMIN_PASSWORD || "Admin@123456",
  fullName: "System Administrator",
  isAdmin: true,
  bio: "ShareCare System Administrator",
});

// Sample user password from environment or default (for development/testing only)
const SAMPLE_USER_PASSWORD = process.env.SAMPLE_USER_PASSWORD || "User@123456";

// Sample users for testing
const SAMPLE_USERS = [
  {
    username: "user1",
    email: "user1@example.com",
    password: SAMPLE_USER_PASSWORD,
    fullName: "Nguyễn Văn A",
    bio: "Người dùng thích chia sẻ đồ vật",
    gender: "male",
  },
  {
    username: "user2",
    email: "user2@example.com",
    password: SAMPLE_USER_PASSWORD,
    fullName: "Trần Thị B",
    bio: "Người dùng thích chia sẻ kiến thức",
    gender: "female",
  },
  {
    username: "user3",
    email: "user3@example.com",
    password: SAMPLE_USER_PASSWORD,
    fullName: "Lê Văn C",
    bio: "Người dùng thích hỗ trợ cộng đồng",
    gender: "male",
  },
];

// Sample posts for testing
const SAMPLE_POSTS = [
  {
    title: "Tặng sách giáo khoa lớp 12",
    description:
      "Mình có bộ sách giáo khoa lớp 12 còn mới, muốn tặng cho các bạn học sinh cần. Sách gồm các môn: Toán, Lý, Hóa, Văn, Anh. Liên hệ để nhận sách nhé!",
    category: "items",
    status: "available",
  },
  {
    title: "Chia sẻ kinh nghiệm học lập trình",
    description:
      "Xin chào mọi người! Mình muốn chia sẻ kinh nghiệm tự học lập trình web trong 6 tháng. Mình đã học HTML, CSS, JavaScript và React. Nếu bạn nào cần hướng dẫn, hãy để lại bình luận nhé!",
    category: "knowledge",
    status: "available",
  },
  {
    title: "Hỗ trợ tâm lý cho sinh viên",
    description:
      "Mình là một tư vấn viên tâm lý. Mình muốn hỗ trợ miễn phí cho các bạn sinh viên đang gặp khó khăn về tâm lý trong học tập và cuộc sống. Hãy nhắn tin cho mình nếu cần nhé!",
    category: "emotional-support",
    status: "available",
  },
  {
    title: "Tặng laptop cũ còn dùng tốt",
    description:
      "Laptop Dell Latitude E6540, Core i5, RAM 8GB, SSD 256GB. Máy còn chạy tốt, phù hợp cho sinh viên học tập và làm việc văn phòng. Ai cần thì liên hệ nhé!",
    category: "items",
    status: "available",
  },
];

// Sample comments
const SAMPLE_COMMENTS = [
  {
    content: "Cảm ơn bạn đã chia sẻ! Mình rất cần bộ sách này.",
  },
  {
    content: "Bài chia sẻ rất hữu ích! Mình cũng đang học React.",
  },
  {
    content: "Cảm ơn bạn vì sự hỗ trợ tuyệt vời này!",
  },
];

async function seedDatabase() {
  try {
    console.log("🚀 Starting database seeding...\n");

    // Connect to MongoDB
    console.log(`📦 Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get admin credentials
    const adminCredentials = getAdminCredentials();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminCredentials.email });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists, skipping admin creation");
    } else {
      console.log("👤 Creating admin user...");
      const admin = new User(adminCredentials);
      await admin.save();
      console.log(`✅ Admin user created: ${adminCredentials.email}`);
      console.log(`   Username: ${adminCredentials.username}`);
      console.log(`   Password: ${adminCredentials.password.substring(0, 3)}${"*".repeat(adminCredentials.password.length - 3)} (CHANGE THIS!)\n`);
    }

    // Ask if we should add sample data
    const args = process.argv.slice(2);
    const addSampleData = args.includes("--sample") || args.includes("-s");

    if (addSampleData) {
      console.log("📝 Adding sample data...\n");

      // Create sample users
      const createdUsers = [];
      for (const userData of SAMPLE_USERS) {
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping`);
          createdUsers.push(existingUser);
        } else {
          const user = new User(userData);
          await user.save();
          console.log(`✅ Created user: ${userData.username}`);
          createdUsers.push(user);
        }
      }
      console.log("");

      // Create sample posts
      console.log("📄 Creating sample posts...");
      for (let i = 0; i < SAMPLE_POSTS.length; i++) {
        const postAuthorIndex = i % createdUsers.length;
        const postData = {
          ...SAMPLE_POSTS[i],
          author: createdUsers[postAuthorIndex]._id,
        };

        const existingPost = await Post.findOne({ title: postData.title });
        if (existingPost) {
          console.log(`⚠️  Post "${postData.title}" already exists, skipping`);
        } else {
          const post = new Post(postData);
          await post.save();
          console.log(`✅ Created post: ${postData.title}`);

          // Add a comment to the post from a different user
          if (SAMPLE_COMMENTS[i]) {
            // Ensure commenter is different from post author
            let commentAuthorIndex = (postAuthorIndex + 1) % createdUsers.length;
            if (commentAuthorIndex === postAuthorIndex) {
              commentAuthorIndex = (postAuthorIndex + 2) % createdUsers.length;
            }
            
            const commentData = {
              post: post._id,
              author: createdUsers[commentAuthorIndex]._id,
              content: SAMPLE_COMMENTS[i].content,
            };
            const comment = new Comment(commentData);
            await comment.save();
            console.log(`   └── Added comment to post`);
          }
        }
      }
      console.log("");
    }

    console.log("🎉 Database seeding completed!\n");
    console.log("=".repeat(50));
    console.log("📋 Summary:");
    console.log(`   - Admin user: ${adminCredentials.email}`);
    if (addSampleData) {
      console.log(`   - Sample users: ${SAMPLE_USERS.length}`);
      console.log(`   - Sample posts: ${SAMPLE_POSTS.length}`);
    }
    console.log("=".repeat(50));
    console.log("\n💡 Usage:");
    console.log("   npm run seed        - Create admin user only");
    console.log("   npm run seed:sample - Create admin + sample data\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the seeder
seedDatabase();
