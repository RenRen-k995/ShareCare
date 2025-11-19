import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Navbar from '../components/Navbar';
import CropModal from '../components/CropModal';
import {
  Undo,
  Redo,
  Image,
  Video,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Quote,
  Code,
  Calendar,
} from 'lucide-react';

export default function CreatePost() {
  const [formData, setFormData] = useState({
    title: '',
    content: '', // HTML string for rich text
    coverImageUrl: '',
    channel: 'general',
    isOriginal: true,
    scheduledDate: '',
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleContentChange = (e) => {
    setFormData({ ...formData, content: e.target.value });
  };

  const handleAddCover = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImagePreview(reader.result);
          setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCropConfirm = (croppedImageUrl) => {
    setFormData({ ...formData, coverImageUrl: croppedImageUrl });
    setIsCropModalOpen(false);
  };

  const handleReupload = () => {
    setIsCropModalOpen(false);
    // Trigger file input again
    setTimeout(() => {
      handleAddCover();
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For now, we'll use the existing API structure
      // In production, you'd update the backend to accept the new fields
      const postData = {
        title: formData.title,
        description: formData.content, // Map content to description for existing API
        category: formData.channel,
        image: coverImage,
      };
      await postService.createPost(postData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const toolbarButtons = [
    { icon: Undo, label: 'Undo' },
    { icon: Redo, label: 'Redo' },
    { icon: Image, label: 'Image' },
    { icon: Video, label: 'Video' },
    { icon: Bold, label: 'Bold' },
    { icon: Italic, label: 'Italic' },
    { icon: Underline, label: 'Underline' },
    { icon: List, label: 'Bullet List' },
    { icon: ListOrdered, label: 'Numbered List' },
    { icon: Link2, label: 'Link' },
    { icon: Quote, label: 'Quote' },
    { icon: Code, label: 'Code' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Main Container Wrapper - Centered Card Layout */}
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-4xl border border-gray-200 rounded-xl shadow-sm bg-white">
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title Input with Border */}
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full text-4xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
              required
            />

            {/* Rich Text Toolbar with Bottom Border */}
            <div className="flex items-center gap-2 py-4 border-b border-gray-200">
              {toolbarButtons.map((button, index) => {
                const Icon = button.icon;
                return (
                  <button
                    key={index}
                    type="button"
                    title={button.label}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      // Placeholder for toolbar actions
                      console.log(`${button.label} clicked`);
                    }}
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                  </button>
                );
              })}
            </div>

            {/* Content Area with Border */}
            <textarea
              placeholder="Start writing your content..."
              value={formData.content}
              onChange={handleContentChange}
              className="w-full min-h-[400px] text-lg bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none resize-none"
              required
            />

            {/* Settings Area */}
            <div className="space-y-6 pt-8 border-t border-gray-200">
              {/* Cover Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                {formData.coverImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '2.5/1' }}>
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleAddCover}
                      className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors text-sm"
                    >
                      Change Cover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddCover}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-cyan-400 hover:bg-gray-50 transition-colors"
                    style={{ aspectRatio: '2.5/1', minHeight: '200px' }}
                  >
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Add Cover</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 2.5:1 aspect ratio</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Channel</label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="items">Items</SelectItem>
                    <SelectItem value="knowledge">Knowledge</SelectItem>
                    <SelectItem value="emotional-support">Emotional Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Original Content Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOriginal"
                  checked={formData.isOriginal}
                  onChange={(e) => setFormData({ ...formData, isOriginal: e.target.checked })}
                  className="w-4 h-4 text-cyan-400 border-gray-300 rounded focus:ring-cyan-400"
                />
                <label htmlFor="isOriginal" className="text-sm text-gray-700">
                  This is original content
                </label>
              </div>

              {/* Scheduled Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Schedule Post (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Bar - Inside Container at Bottom */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg px-8"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal */}
      <CropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onConfirm={handleCropConfirm}
        onReupload={handleReupload}
        imageUrl={coverImagePreview}
      />
    </div>
  );
}
