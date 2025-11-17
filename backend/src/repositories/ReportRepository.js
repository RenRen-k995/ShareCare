import Report from '../models/Report.js';

class ReportRepository {
  async create(reportData) {
    const report = new Report(reportData);
    return await report.save();
  }

  async findById(id) {
    return await Report.findById(id)
      .populate('post', 'title description')
      .populate('reporter', 'username email')
      .populate('reviewedBy', 'username');
  }

  async update(id, updateData) {
    return await Report.findByIdAndUpdate(id, updateData, { new: true })
      .populate('post', 'title description')
      .populate('reporter', 'username email')
      .populate('reviewedBy', 'username');
  }

  async delete(id) {
    return await Report.findByIdAndDelete(id);
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const reports = await Report.find(query)
      .populate('post', 'title description author')
      .populate('reporter', 'username email')
      .populate('reviewedBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);

    return { reports, total, page, pages: Math.ceil(total / limit) };
  }

  async findByStatus(status, options = {}) {
    return await this.findAll({ status }, options);
  }

  async findByPost(postId) {
    return await Report.find({ post: postId })
      .populate('reporter', 'username email');
  }
}

export default new ReportRepository();
