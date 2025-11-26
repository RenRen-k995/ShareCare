import Post from "../models/Post.js";

class PostRepository {
  async create(postData) {
    const post = new Post(postData);
    return await post.save();
  }

  async findById(id) {
    return await Post.findById(id).populate(
      "author",
      "username fullName avatar"
    );
  }

  async update(id, updateData) {
    return await Post.findByIdAndUpdate(id, updateData, { new: true }).populate(
      "author",
      "username fullName avatar"
    );
  }

  async delete(id) {
    return await Post.findByIdAndDelete(id);
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate("author", "username fullName avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    return { posts, total, page, pages: Math.ceil(total / limit) };
  }

  async search(searchTerm, query = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const searchQuery = {
      ...query,
      $text: { $search: searchTerm },
    };

    const posts = await Post.find(searchQuery)
      .populate("author", "username fullName avatar")
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(searchQuery);

    return { posts, total, page, pages: Math.ceil(total / limit) };
  }

  async incrementViewCount(id) {
    return await Post.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  }

  async addReaction(postId, userId, reactionType) {
    return await Post.findByIdAndUpdate(
      postId,
      { $push: { reactions: { user: userId, type: reactionType } } },
      { new: true }
    );
  }

  async removeReaction(postId, userId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $pull: { reactions: { user: userId } } },
      { new: true }
    );
  }

  async findByAuthor(authorId, options = {}) {
    return await this.findAll({ author: authorId }, options);
  }
}

export default new PostRepository();
