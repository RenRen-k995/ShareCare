import User from '../models/User.js';

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async findByIdWithPassword(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    return { users, total, page, pages: Math.ceil(total / limit) };
  }
}

export default new UserRepository();
