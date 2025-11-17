import Comment from '../models/Comment.js';

class CommentRepository {
  async create(commentData) {
    const comment = new Comment(commentData);
    return await comment.save();
  }

  async findById(id) {
    return await Comment.findById(id)
      .populate('author', 'username fullName avatar')
      .populate('post', 'title');
  }

  async update(id, updateData) {
    return await Comment.findByIdAndUpdate(id, updateData, { new: true })
      .populate('author', 'username fullName avatar');
  }

  async delete(id) {
    return await Comment.findByIdAndDelete(id);
  }

  async findByPost(postId, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username fullName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: postId });

    return { comments, total, page, pages: Math.ceil(total / limit) };
  }

  async deleteByPost(postId) {
    return await Comment.deleteMany({ post: postId });
  }
}

export default new CommentRepository();
