import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import MainLayout from "../components/layout/MainLayout";
import CropModal from "../components/CropModal";
import RichTextEditor from "../components/RichTextEditor";
import { Image, Calendar } from "lucide-react";

export default function CreatePost() {
  const [formData, setFormData] = useState({
    title: "",
    content: "", // HTML string for rich text
    coverImageUrl: "",
    channel: "general",
    isOriginal: true,
    scheduledDate: "",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleContentChange = (html) => {
    setFormData({ ...formData, content: html });
  };

  const handleAddCover = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
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
    setError("");
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
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <MainLayout>
      {/* Main Container Wrapper - Centered Card Layout */}
      <div className="flex justify-center px-8 py-8">
        <div className="w-full max-w-4xl bg-white border border-gray-100 shadow-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 rounded-lg bg-red-50">
                {error}
              </div>
            )}

            {/* Title Input with Border */}
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 text-2xl font-bold text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              required
            />

            {/* Rich Text Editor */}
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Start writing your content..."
            />

            {/* Settings Area */}
            <div className="pt-8 space-y-6 border-t border-gray-200">
              {/* Cover Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Image
                </label>
                {formData.coverImageUrl ? (
                  <div
                    className="relative overflow-hidden rounded-lg"
                    style={{ aspectRatio: "2.5/1" }}
                  >
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={handleAddCover}
                      className="absolute px-4 py-2 text-sm transition-colors rounded-lg shadow-md bottom-4 right-4 bg-white/90 hover:bg-white"
                    >
                      Change Cover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddCover}
                    className="flex items-center justify-center w-full transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-cyan-400 hover:bg-gray-50"
                    style={{ aspectRatio: "2.5/1", minHeight: "200px" }}
                  >
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Add Cover</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Recommended: 2.5:1 aspect ratio
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, channel: value })
                  }
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="items">Items</SelectItem>
                    <SelectItem value="knowledge">Knowledge</SelectItem>
                    <SelectItem value="emotional-support">
                      Emotional Support
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Bar - Inside Container at Bottom */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-8 text-white rounded-lg bg-cyan-400 hover:bg-cyan-500"
              >
                {loading ? "Publishing..." : "Publish"}
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
    </MainLayout>
  );
}
