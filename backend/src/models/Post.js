import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['items', 'knowledge', 'emotional-support', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'donated', 'closed'],
    default: 'available'
  },
  image: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'helpful'],
      default: 'like'
    }
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for searching
postSchema.index({ title: 'text', description: 'text' });
postSchema.index({ category: 1, status: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
