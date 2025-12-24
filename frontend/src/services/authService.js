import api from "../lib/api";

export const authService = {
  async register(userData) {
    const response = await api.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  async getProfile() {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  async updateProfile(updateData) {
    const response = await api.put("/auth/profile", updateData);
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.post("/auth/change-password", passwordData);
    return response.data;
  },

  async changeEmail(emailData) {
    const response = await api.post("/auth/change-email", emailData);
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get public user profile by ID
  async getUserById(userId) {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },

  // Toggle follow/unfollow user
  async toggleFollow(userId) {
    const response = await api.post(`/auth/users/${userId}/follow`);
    return response.data;
  },

  // Toggle save/unsave post
  async toggleSavePost(postId) {
    const response = await api.post(`/auth/posts/${postId}/save`);
    return response.data;
  },

  // Get saved posts
  async getSavedPosts() {
    const response = await api.get("/auth/saved-posts");
    return response.data;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};

export default authService;
