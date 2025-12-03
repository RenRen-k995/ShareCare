import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { ThumbsUp, MessageSquare, MoreHorizontal, Bookmark, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import reportService from "../services/reportService";
import { extractTextFromHtml, extractFirstLineFromHtml } from "../utils/htmlUtils";
import { formatTimeAgo } from "../lib/utils";
import { getCategoryStyles, getImageUrl } from "../constants";

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.reactions?.length || 0);
  const [localIsLiked, setLocalIsLiked] = useState(
    user && post.reactions?.some((r) => r.user === user.id)
  );

  const handleReaction = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    const previousIsLiked = localIsLiked;
    const previousLikes = localLikes;
    setLocalIsLiked(!previousIsLiked);
    setLocalLikes(previousIsLiked ? previousLikes - 1 : previousLikes + 1);
    try {
      await postService.toggleReaction(post._id);
    } catch {
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

  return (
    <Link
      to={`/posts/${post._id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full p-5 transition-all duration-200 cursor-pointer neu-card neu-card-hover rounded-3xl"
      onClick={(e) => {
        if (e.target.closest("button") || e.target.closest('[role="button"]')) {
          e.preventDefault();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden border rounded-full bg-gray-100 border-gray-50 shrink-0">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-sm font-bold text-gray-400">
                {post.author?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-900 text-[15px]">
                {post.author?.username || "Unknown"}
              </span>
              <span className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`font-normal text-xs px-2.5 py-0.5 h-5 ${getCategoryStyles(post.category)}`}>
                {post.category === "items" ? "Item" : post.category}
              </Badge>
              {post.category === "items" && post.status === "available" && (
                <Badge variant="outline" className="font-normal text-xs px-2.5 py-0.5 h-5 text-primary-600 border-primary-200 bg-primary-50">
                  Available
                </Badge>
              )}
              {post.category === "items" && post.status === "donated" && (
                <Badge className="font-normal text-xs px-2.5 py-0.5 h-5 bg-primary-500 text-white border-transparent">
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
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-full text-gray-400 hover:bg-gray-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReportMenu(!showReportMenu);
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showReportMenu && (
              <div className="absolute right-0 z-10 w-40 py-1 overflow-hidden bg-white border shadow-lg top-8 border-gray-100 rounded-xl">
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
                    className="w-full px-4 py-2 text-xs text-left text-gray-600 hover:bg-gray-50"
                  >
                    Report Spam
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Content */}
      {post.image && (
        <div className="w-full sm:w-9/12 mb-3 overflow-hidden border rounded-2xl border-gray-100">
          <img
            src={getImageUrl(post.image)}
            alt={post.title}
            className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
          />
        </div>
      )}

      {/* Title */}
      <div className="px-1 mb-1 text-gray-900 text-[17px]">
        <p className="line-clamp-1">{extractTextFromHtml(post.title, 70)}</p>
      </div>

      {/* Text Content */}
      <div className="px-1 mb-2">
        <p className="text-gray-400 text-[15px] leading-relaxed line-clamp-1">
          {extractFirstLineFromHtml(post.description, 80)}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex gap-2 sm:gap-3">
          <button
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              localIsLiked
                ? "bg-primary-50 text-primary-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } ${isLikeAnimating ? "scale-110" : "scale-100"}`}
            onClick={handleReaction}
          >
            <ThumbsUp className={`w-4 h-4 transition-transform ${localIsLiked ? "fill-current scale-110" : ""}`} />
            <span>{localLikes > 0 ? localLikes : "Like"}</span>
          </button>
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium transition-colors rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments?.length > 0 ? post.comments.length : "Comments"}</span>
          </button>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-2 transition-colors rounded-full text-gray-400 hover:bg-gray-50"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </Link>
  );
}
