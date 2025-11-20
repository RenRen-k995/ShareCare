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
import CropModal from "../components/CropModal";
import RichTextEditor from "../components/RichTextEditor";
import { ChevronLeft, Image as ImageIcon } from "lucide-react";

export default function CreatePost() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    coverImageUrl: "",
    channel: "general",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const postData = {
        title: formData.title,
        description: formData.content,
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
    <div className="flex flex-col min-h-screen bg-[#F5F7F7]">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-50 h-16 bg-white">
        <div className="flex items-center justify-between h-full max-w-6xl px-6 mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Creation Center</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 overflow-hidden border border-gray-200 rounded-full">
                <img
                  src={user?.avatar || "https://github.com/shadcn.png"}
                  alt="User"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 w-full max-w-4xl p-6 pb-32 mx-auto">
        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-100 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Main White Card Container */}
        {/* IMPORTANT: No overflow-hidden here, or sticky breaks */}
        <div className="bg-white rounded-2xl p-8 min-h-[80vh]">
          {/* Header Row: Title + Drafts */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">New Article</h2>
          </div>

          {/* 1. Title Input - Standalone */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Enter a title"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 py-3 text-2xl font-medium text-gray-900 placeholder-gray-300 transition-colors border border-gray-200 outline-none rounded-xl focus:border-gray-400"
              maxLength={120}
            />
            <span className="absolute text-xs text-gray-300 pointer-events-none right-4 top-4">
              {formData.title.length}/120
            </span>
          </div>

          {/* 2. The Editor "Box" Component */}
          <div className="mb-10">
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Share your thoughts, keep it friendly"
            />
          </div>

          {/* 3. Settings Section */}
          <div className="max-w-2xl space-y-8">
            {/* Channel */}
            <div>
              <label className="block mb-2 text-base font-bold text-gray-900">
                Select Channel <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.channel}
                onValueChange={(value) =>
                  setFormData({ ...formData, channel: value })
                }
              >
                <SelectTrigger className="w-full transition-colors border-transparent rounded-lg bg-gray-50 hover:bg-gray-100 h-11">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="items">Items (Donation)</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="emotional-support">
                    Emotional Support
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="flex flex-col block mb-2 text-base font-bold text-gray-900">
                <div>
                  Add Cover <span className="text-red-500">*</span>
                </div>
                <span className="ml-2 text-xs font-normal text-gray-400">
                  Add a cover image that fits your content to attract more
                  views.
                </span>
              </label>

              {formData.coverImageUrl ? (
                <div className="relative w-[300px] overflow-hidden rounded-lg group aspect-video bg-gray-50 border border-gray-100">
                  <img
                    src={formData.coverImageUrl}
                    alt="Cover"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddCover}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddCover}
                  className="flex flex-col items-center justify-center w-[300px] aspect-video transition-all bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <div className="flex items-center justify-center w-8 h-8 mb-2">
                    <span className="text-3xl font-light text-gray-300">+</span>
                  </div>
                  <span className="text-sm text-gray-400">Add image</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-12 border-t border-gray-100">
            <Button
              variant="secondary"
              className="px-8 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.title}
              className="px-8 text-white rounded-full shadow-md bg-cyan-400 hover:bg-cyan-500"
            >
              {loading ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </main>

      <CropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onConfirm={handleCropConfirm}
        onReupload={() => {
          setIsCropModalOpen(false);
          setTimeout(handleAddCover, 100);
        }}
        imageUrl={coverImagePreview}
      />
    </div>
  );
}
