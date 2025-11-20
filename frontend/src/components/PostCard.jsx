import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import {
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Send,
  Bookmark,
  Plus,
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

  const handleReaction = async (e) => {
    e.stopPropagation();
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
    e.stopPropagation();
    navigate("/chat", {
      state: { userId: post.author?._id, postId: post._id },
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Helper for Category Colors
  const getCategoryStyles = (category) => {
    const styles = {
      items:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent",
      knowledge:
        "bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent",
      "emotional-support":
        "bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent",
      other:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent",
    };
    return styles[category] || styles["other"];
  };

  const userReacted = user && post.reactions?.some((r) => r.user === user.id);

  return (
    <div
      className="w-full p-5 mb-6 transition-all duration-200 bg-white border border-transparent cursor-pointer rounded-3xl hover:border-slate-100 hover:shadow-sm"
      onClick={() => navigate(`/posts/${post._id}`)}
    >
      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 overflow-hidden border rounded-full bg-slate-100 border-slate-50 shrink-0">
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt=""
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-sm font-bold text-slate-400">
                {post.author?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Meta & Badges */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-[15px]">
                {post.author?.username || "Unknown"}
              </span>
              <span className="text-sm text-slate-400">
                {formatTime(post.createdAt)}
              </span>
            </div>

            {/* BADGES ROW */}
            <div className="flex items-center gap-2">
              {/* Category Badge with Dynamic Colors */}
              <Badge
                className={`font-normal text-xs px-2.5 py-0.5 h-5 ${getCategoryStyles(
                  post.category
                )}`}
              >
                {post.category === "items" ? "Item" : post.category}
              </Badge>

              {/* Status Badge - Only show if explicitly 'available' or 'donated' */}
              {post.status === "available" && (
                <Badge
                  variant="outline"
                  className="font-normal text-xs px-2.5 py-0.5 h-5 text-emerald-600 border-emerald-200 bg-emerald-50"
                >
                  Available
                </Badge>
              )}
              {post.status === "donated" && (
                <Badge className="font-normal text-xs px-2.5 py-0.5 h-5 bg-blue-500 text-white hover:bg-blue-600 border-transparent">
                  Donated
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-full text-slate-400 hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowReportMenu(!showReportMenu);
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showReportMenu && (
              <div className="absolute right-0 z-10 w-40 py-1 overflow-hidden bg-white border shadow-lg top-8 border-slate-100 rounded-xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReport("spam");
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-600 hover:bg-slate-50"
                >
                  Report Spam
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- IMAGE CONTENT --- */}
      {post.image && (
        <div className="w-full mb-3 overflow-hidden border rounded-2xl border-slate-100">
          <img
            src={`${API_URL}${post.image}`}
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}

      {/* --- TEXT CONTENT --- */}
      <div className="px-1 mb-4">
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
          {extractTextFromHtml(post.description, 300)}
        </p>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-3">
          {/* Like Pill */}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              userReacted
                ? "bg-red-50 text-red-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={handleReaction}
          >
            <ThumbsUp
              className={`w-4 h-4 ${userReacted ? "fill-current" : ""}`}
            />
            <span>
              {post.reactions?.length > 0 ? post.reactions.length : "Like"}
            </span>
          </button>

          {/* Comment Pill */}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <MessageSquare className="w-4 h-4" />
            <span>
              {post.comments?.length > 0 ? post.comments.length : "Comments"}
            </span>
          </button>

          {/* Contact Button */}
          {post.category === "items" &&
            post.status === "available" &&
            user &&
            post.author?._id !== user.id && (
              <button
                onClick={handleContactToReceive}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-black rounded-full shadow-sm hover:bg-gray-800"
              >
                <Send className="w-3 h-3" />
                <span>Contact</span>
              </button>
            )}
        </div>

        <button className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-50">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
