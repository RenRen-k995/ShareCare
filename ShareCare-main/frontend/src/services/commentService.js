import api from '../lib/api';

export const commentService = {
  async getCommentsByPost(postId, params = {}) {
    const response = await api.get(`/comments/post/${postId}`, { params });
    return response.data;
  },

  async createComment(commentData) {
    const response = await api.post('/comments', commentData);
    return response.data;
  },

  async updateComment(id, content) {
    const response = await api.put(`/comments/${id}`, { content });
    return response.data;
  },

  async deleteComment(id) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};

export default commentService;
