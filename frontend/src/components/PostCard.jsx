import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import {
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Bookmark,
  Plus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import reportService from "../services/reportService";
import {
  extractTextFromHtml,
  extractFirstLineFromHtml,
} from "../utils/htmlUtils";

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Optimistic UI State
  const [localLikes, setLocalLikes] = useState(post.reactions?.length || 0);
  const [localIsLiked, setLocalIsLiked] = useState(
    user && post.reactions?.some((r) => r.user === user.id)
  );

  const handleReaction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    // 1. Trigger Animation
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    // 2. Optimistic Update (Immediate visual feedback)
    const previousIsLiked = localIsLiked;
    const previousLikes = localLikes;

    setLocalIsLiked(!previousIsLiked);
    setLocalLikes(previousIsLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      // 3. API Call in background
      await postService.toggleReaction(post._id);
      // We do NOT call onUpdate() here to avoid page reload/flicker
    } catch {
      // Revert on error
      setLocalIsLiked(previousIsLiked);
      setLocalLikes(previousLikes);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await postService.deletePost(post._id);
      setShowReportMenu(false);
      // Immediate UI update
      if (onDelete) {
        onDelete(post._id);
      } else if (onUpdate) {
        onUpdate();
      }
    } catch {
      alert("Failed to delete post");
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
    } catch {
      alert("Failed to submit report");
    }
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

  return (
    <Link
      to={`/posts/${post._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full p-5 mb-6 transition-all duration-200 bg-white border border-transparent cursor-pointer rounded-3xl hover:border-slate-100 hover:shadow-sm"
      onClick={(e) => {
        // Prevent navigation if clicking on interactive elements
        if (e.target.closest("button") || e.target.closest('[role="button"]')) {
          e.preventDefault();
        }
      }}
    >
      {/* --- HEADER --- */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
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

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-[15px]">
                {post.author?.username || "Unknown"}
              </span>
              <span className="text-sm text-slate-400">
                {formatTime(post.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`font-normal text-xs px-2.5 py-0.5 h-5 ${getCategoryStyles(
                  post.category
                )}`}
              >
                {post.category === "items" ? "Item" : post.category}
              </Badge>

              {post.category === "items" && post.status === "available" && (
                <Badge
                  variant="outline"
                  className="font-normal text-xs px-2.5 py-0.5 h-5 text-emerald-600 border-emerald-200 bg-emerald-50"
                >
                  Available
                </Badge>
              )}
              {post.category === "items" && post.status === "donated" && (
                <Badge className="font-normal text-xs px-2.5 py-0.5 h-5 bg-blue-500 text-white hover:bg-blue-600 border-transparent">
                  Donated
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-full text-slate-400 hover:bg-slate-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReportMenu(!showReportMenu);
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showReportMenu && (
              <div className="absolute right-0 z-10 w-40 py-1 overflow-hidden bg-white border shadow-lg top-8 border-slate-100 rounded-xl">
                {user && post.author?._id === user.id ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-red-600 hover:bg-red-50"
                  >
                    Delete Post
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleReport("spam");
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-slate-600 hover:bg-slate-50"
                  >
                    Report Spam
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- IMAGE CONTENT --- */}
      {post.image && (
        <div className="w-9/12 mb-3 overflow-hidden border rounded-2xl border-slate-100">
          <img
            src={`${API_URL}${post.image}`}
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}

      {/* --- TITLE --- */}
      <div className="px-1 mb-1 text-gray-900 text-[17px]">
        <p>{extractTextFromHtml(post.title, 100)}</p>
      </div>

      {/* --- TEXT CONTENT --- */}
      <div className="px-1 mb-4">
        <p className="text-gray-400 text-[15px] leading-relaxed truncate">
          {extractFirstLineFromHtml(post.description, 120)}
        </p>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-3">
          {/* Like Pill with Animation - Using Theme Color (Cyan/Teal) */}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              localIsLiked
                ? "bg-cyan-50 text-cyan-500" // Theme match
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            } ${isLikeAnimating ? "scale-110" : "scale-100"}`}
            onClick={handleReaction}
          >
            <ThumbsUp
              className={`w-4 h-4 transition-transform ${
                localIsLiked ? "fill-current scale-110" : ""
              }`}
            />
            <span>{localLikes > 0 ? localLikes : "Like"}</span>
          </button>

          {/* Comment Pill */}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <MessageSquare className="w-4 h-4" />
            <span>
              {post.comments?.length > 0 ? post.comments.length : "Comments"}
            </span>
          </button>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-50"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </Link>
  );
}
