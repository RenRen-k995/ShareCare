/**
 * Post data structure interface
 * Mirrors the MongoDB Schema for backend connection
 */
export interface Post {
  _id?: string;
  title: string;
  content: string; // HTML string for rich text content
  coverImageUrl?: string;
  channel: string;
  isOriginal: boolean;
  scheduledDate?: Date | string;
  author?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Form data for creating/editing posts
 */
export interface PostFormData {
  title: string;
  content: string;
  coverImageUrl?: string;
  channel: string;
  isOriginal: boolean;
  scheduledDate?: string;
}
