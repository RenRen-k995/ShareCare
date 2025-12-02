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
import { ErrorMessage, Avatar } from "../components/common";
import { CATEGORY_OPTIONS } from "../constants";

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

  const handleCropConfirm = async (croppedImageUrl) => {
    try {
      setFormData({ ...formData, coverImageUrl: croppedImageUrl });
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "cover_image.jpg", { type: "image/jpeg" });
      setCoverImage(file);
      setIsCropModalOpen(false);
    } catch (err) {
      console.error("Error processing cropped image:", err);
      setError("Failed to process cropped image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (formData.content.length > 10000) {
        setError(
          `Content is too long (${formData.content.length.toLocaleString()} characters). Maximum allowed is 10,000 characters.`
        );
        setLoading(false);
        return;
      }
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 h-16 neu-card border-b border-gray-100">
        <div className="flex items-center justify-between h-full max-w-6xl px-4 md:px-6 mx-auto">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Creation Center</h1>
          <Avatar src={user?.avatar} alt={user?.username} fallback={user?.username} size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl p-4 md:p-6 pb-32 mx-auto">
        <ErrorMessage message={error} className="mb-4 rounded-lg" />

        <div className="neu-card rounded-2xl p-4 md:p-8 min-h-[80vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">New Article</h2>
          </div>

          {/* Title Input */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Enter a title"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 py-3 text-xl md:text-2xl font-medium text-gray-900 placeholder-gray-300 transition-colors border border-gray-200 outline-none rounded-xl neu-input focus:border-primary-500"
              maxLength={120}
            />
            <span className="absolute text-xs text-gray-300 pointer-events-none right-4 top-4">
              {formData.title.length}/120
            </span>
          </div>

          {/* Editor */}
          <div className="mb-10">
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Share your thoughts, keep it friendly"
              maxLength={10000}
            />
          </div>

          {/* Settings Section */}
          <div className="max-w-2xl space-y-8">
            {/* Channel */}
            <div>
              <label className="block mb-2 text-base font-bold text-gray-900">
                Select Channel <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger className="w-full transition-colors border-transparent rounded-xl bg-gray-50 h-11">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cover Image */}
            <div>
              <label className="flex flex-col block mb-2 text-base font-bold text-gray-900">
                <div>Add Cover <span className="text-red-500">*</span></div>
                <span className="text-xs font-normal text-gray-400">
                  Add a cover image that fits your content to attract more views.
                </span>
              </label>
              {formData.coverImageUrl ? (
                <div className="relative w-full sm:w-[300px] overflow-hidden rounded-xl group aspect-video bg-gray-50 border border-gray-100">
                  <img src={formData.coverImageUrl} alt="Cover" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                    <Button variant="secondary" size="sm" onClick={handleAddCover}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddCover}
                  className="flex flex-col items-center justify-center w-full sm:w-[300px] aspect-video transition-all bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400"
                >
                  <span className="text-3xl font-light text-gray-300 mb-2">+</span>
                  <span className="text-sm text-gray-400">Add image</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 mt-12 border-t border-gray-100">
            <Button variant="secondary" className="w-full sm:w-auto px-8 rounded-full">
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.title}
              className="w-full sm:w-auto px-8 rounded-full"
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
