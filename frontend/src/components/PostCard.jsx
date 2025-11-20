import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Flag,
  Share2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import reportService from "../services/reportService";
import { extractTextFromHtml } from "../utils/htmlUtils";

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [showReportMenu, setShowReportMenu] = useState(false);

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(post._id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleReport = async (reason) => {
    if (!user) return;
    try {
      await reportService.createReport({
        post: post._id,
        reason,
        description: `Report from feed`,
      });
      alert("Report submitted successfully");
      setShowReportMenu(false);
    } catch (error) {
      alert("Failed to submit report");
    }
  };

  const handleContactToReceive = (e) => {
    e.stopPropagation(); // Prevent clicking the card itself
    navigate("/chat", {
      state: { userId: post.author?._id, postId: post._id },
    });
  };

  // Helper to format date like "Oct 28" or "Yesterday"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryColor = (category) => {
    const colors = {
      items: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
      knowledge: "text-blue-600 bg-blue-50 hover:bg-blue-100",
      "emotional-support": "text-purple-600 bg-purple-50 hover:bg-purple-100",
      other: "text-gray-600 bg-gray-50 hover:bg-gray-100",
    };
    return colors[category] || colors["other"];
  };

  const userReacted = user && post.reactions?.some((r) => r.user === user.id);

  return (
    <div className="w-full p-5 mb-4 transition-all duration-200 bg-white border rounded-3xl hover:shadow-md border-gray-100/50">
      {/* --- HEADER: Avatar, Info, Top Actions --- */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shrink-0">
            {/* Placeholder for Avatar Image if you have one, else Initials */}
            <span className="text-sm font-bold text-gray-600">
              {post.author?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col gap-0 text-sm md:flex-row md:items-center md:gap-2">
            <span className="text-base font-bold text-gray-900">
              {post.author?.username || "Unknown"}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 md:text-sm">
              <span className="hidden md:inline">•</span>
              <span>{formatDate(post.createdAt)}</span>
              <span className="hidden md:inline">•</span>
              {/* Category Badge (Styled like the 'Game' tag in reference) */}
              <Badge
                variant="secondary"
                className={`rounded-md px-2 py-0.5 font-medium border-0 cursor-pointer transition-colors ${getCategoryColor(
                  post.category
                )}`}
              >
                {post.category === "items" ? "Item" : post.category}
              </Badge>
              {post.status === "donated" && (
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 text-[10px] px-2 py-0.5">
                  Donated
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Actions (More Menu) */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
            onClick={() => setShowReportMenu(!showReportMenu)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>

          {/* Simple Dropdown for Report */}
          {showReportMenu && (
            <div className="absolute right-0 z-10 w-40 py-1 overflow-hidden bg-white border border-gray-100 shadow-lg top-8 rounded-xl animation-fade-in">
              <button
                onClick={() => handleReport("spam")}
                className="flex items-center w-full gap-2 px-4 py-2 text-xs text-left text-gray-600 hover:bg-gray-50"
              >
                <Flag className="w-3 h-3" /> Spam
              </button>
              <button
                onClick={() => handleReport("inappropriate")}
                className="w-full px-4 py-2 text-xs text-left text-gray-600 hover:bg-gray-50"
              >
                Inappropriate
              </button>
              <button
                onClick={() => handleReport("scam")}
                className="w-full px-4 py-2 text-xs text-left text-red-500 hover:bg-red-50"
              >
                Scam
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- CONTENT: Image first, then Text (Like reference) --- */}
      <div className="pl-0 md:pl-[52px]">
        {" "}
        {/* Indent to align with name, not avatar */}
        {/* Main Image */}
        {post.image && (
          <div className="mb-3 overflow-hidden border border-gray-100 rounded-2xl">
            <img
              src={`${API_URL}${post.image}`}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        )}
        {/* Text Content */}
        <div className="mb-2">
          <h3 className="mb-1 text-2xl font-bold text-gray-900">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {extractTextFromHtml(post.description, 300)}
          </p>
        </div>
        {/* --- FOOTER: Actions --- */}
        <div className="flex items-center justify-between pt-2 mt-4">
          {/* Left: Social Actions */}
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReaction}
              className={`rounded-full px-3 h-9 flex items-center gap-2 transition-colors ${
                userReacted
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-500 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${userReacted ? "fill-current" : ""}`}
              />
              <span className="text-sm font-medium">
                {post.reactions?.length || 0}
              </span>
            </Button>

            <Link to={`/posts/${post._id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 text-gray-500 transition-colors rounded-full h-9 hover:text-blue-500 hover:bg-blue-50"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post.comments?.length || 0}
                </span>
              </Button>
            </Link>
          </div>

          {/* Right: Primary Action (Contact) */}
          <div>
            {post.category === "items" &&
            post.status === "available" &&
            user &&
            post.author?._id !== user.id ? (
              <Button
                onClick={handleContactToReceive}
                className="flex items-center gap-2 px-5 text-sm font-medium text-white border-0 rounded-full shadow-sm bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 h-9"
              >
                <Send className="w-4 h-4" />
                <span>Contact</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 rounded-full"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
