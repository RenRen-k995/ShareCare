import api from '../lib/api';

export const postService = {
  async getPosts(params = {}) {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async createPost(postData) {
    const formData = new FormData();
    Object.keys(postData).forEach(key => {
      formData.append(key, postData[key]);
    });
    const response = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updatePost(id, postData) {
    const formData = new FormData();
    Object.keys(postData).forEach(key => {
      if (postData[key] !== undefined) {
        formData.append(key, postData[key]);
      }
    });
    const response = await api.put(`/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async updatePostStatus(id, status) {
    const response = await api.patch(`/posts/${id}/status`, { status });
    return response.data;
  },

  async toggleReaction(id, type = 'like') {
    const response = await api.post(`/posts/${id}/reaction`, { type });
    return response.data;
  }
};

export default postService;
