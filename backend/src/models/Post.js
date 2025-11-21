import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 10000 },
    category: {
      type: String,
      required: true,
      enum: ["items", "knowledge", "emotional-support", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["available", "pending", "donated", "closed"],
      default: "available",
    },
    image: { type: String, default: "" },
    contentImages: [{ type: String }], // Array of inline image URLs
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "heart", "helpful"],
          default: "like",
        },
      },
    ],
    viewCount: { type: Number, default: 0 },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
postSchema.index({ title: "text", description: "text" });
postSchema.index({ category: 1, status: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
