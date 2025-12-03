import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Image, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import postService from "../services/postService";
import CropModal from "./CropModal";
import { Avatar, ErrorMessage } from "./common";
import { CATEGORY_OPTIONS } from "../constants";

export default function CreatePostWidget() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  const MAX_LENGTH = 1500;

  const handleTextareaClick = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setContent("");
    setCategory("general");
    setCoverImage(null);
    setCoverImagePreview("");
    setError("");
  };

  const handleImageSelect = () => {
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
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "cover_image.jpg", { type: "image/jpeg" });
      setCoverImage(file);
      setCoverImagePreview(croppedImageUrl);
      setIsCropModalOpen(false);
    } catch (err) {
      console.error("Error processing cropped image:", err);
      setError("Failed to process cropped image");
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please enter some content");
      return;
    }
    if (content.length > MAX_LENGTH) {
      setError(`Content exceeds ${MAX_LENGTH} characters`);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const postData = {
        title: content.substring(0, 100) || "Untitled Post",
        description: content,
        category: category,
        image: coverImage,
      };
      await postService.createPost(postData);
      handleCancel();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 mb-4 neu-card neu-card-hover rounded-2xl">
        <div className="flex items-start gap-4">
          <Avatar src={user?.avatar} alt={user?.username} fallback={user?.username} size="lg" />
          <div className="flex-1">
            {!isExpanded ? (
              <button
                onClick={handleTextareaClick}
                className="w-full px-6 py-4 text-left text-gray-400 transition-all cursor-pointer bg-gray-50 neu-input rounded-2xl hover:bg-gray-100"
              >
                What would you like to share today?
              </button>
            ) : (
              <div className="space-y-4">
                <ErrorMessage message={error} className="rounded-lg" />
                {coverImagePreview && (
                  <div className="relative w-6/12 overflow-hidden border rounded-xl border-gray-200">
                    <img src={coverImagePreview} alt="Cover" className="object-cover w-full h-48" />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute p-1 text-white transition-colors bg-black rounded-full top-2 right-2 bg-opacity-60 hover:bg-opacity-80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, item details, or support message..."
                    className="w-full px-6 py-4 text-gray-900 transition-all border-2 border-transparent resize-none bg-gray-50 neu-input rounded-2xl focus:outline-none focus:border-primary-500 focus:bg-white"
                    rows={6}
                    maxLength={MAX_LENGTH}
                    autoFocus
                  />
                  <div className="absolute text-xs text-gray-400 bottom-3 right-4">
                    {content.length}/{MAX_LENGTH}
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={handleImageSelect}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 transition-colors rounded-lg hover:bg-primary-50 hover:text-primary-600"
                    >
                      <Image className="w-5 h-5" />
                      <span>Image</span>
                    </button>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-[180px] h-9 border-transparent bg-gray-50">
                        <SelectValue placeholder="Category" />
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
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" className="rounded-full" disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="rounded-full"
                      disabled={loading || !content.trim()}
                    >
                      {loading ? "Posting..." : "Share"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCropModalOpen && (
        <CropModal
          imageSrc={coverImagePreview}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setIsCropModalOpen(false);
            setCoverImagePreview("");
          }}
        />
      )}
    </>
  );
}
