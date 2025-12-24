import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import {
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Bookmark,
  Plus,
  Check,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import reportService from "../services/reportService";
import authService from "../services/authService";
import {
  extractTextFromHtml,
  extractFirstLineFromHtml,
} from "../utils/htmlUtils";
import { formatTimeAgo } from "../lib/utils";
import { getCategoryStyles, getImageUrl } from "../constants";

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // Optimistic UI State
  const [localLikes, setLocalLikes] = useState(post.reactions?.length || 0);
  const [localIsLiked, setLocalIsLiked] = useState(
    user && post.reactions?.some((r) => r.user === user.id)
  );

  // Follow/Save State
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check if already following and saved
  useEffect(() => {
    if (user && post.author?._id) {
      setIsFollowing(user.following?.includes(post.author._id));
      setIsSaved(user.savedPosts?.includes(post._id));
    }
  }, [user, post.author?._id, post._id]);

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

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.author?._id) {
      // If it's the current user, go to profile, else go to user profile page
      if (user && post.author._id === user.id) {
        navigate("/profile");
      } else {
        navigate(`/user/${post.author._id}`);
      }
    }
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !post.author?._id || post.author._id === user.id) return;

    setFollowLoading(true);
    const previousIsFollowing = isFollowing;
    setIsFollowing(!previousIsFollowing);

    try {
      const result = await authService.toggleFollow(post.author._id);
      // Update user in localStorage
      const updatedUser = {
        ...user,
        following: result.isFollowing
          ? [...(user.following || []), post.author._id]
          : (user.following || []).filter((id) => id !== post.author._id),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
    } catch {
      setIsFollowing(previousIsFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setSaveLoading(true);
    const previousIsSaved = isSaved;
    setIsSaved(!previousIsSaved);

    try {
      const result = await authService.toggleSavePost(post._id);
      // Update user in localStorage
      const updatedUser = {
        ...user,
        savedPosts: result.savedPosts || [],
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
    } catch {
      setIsSaved(previousIsSaved);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Link
        to={`/posts/${post._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full p-5 bg-white cursor-pointer rounded-3xl"
        onClick={(e) => {
          if (
            e.target.closest("button") ||
            e.target.closest('[role="button"]')
          ) {
            e.preventDefault();
          }
        }}
      >
        {/* --- HEADER --- */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAvatarClick}
              className="overflow-hidden transition-all bg-gray-100 rounded-full size-12 shrink-0 hover:ring-2 hover:ring-emerald-300"
            >
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt=""
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-sm font-bold text-gray-400">
                  {post.author?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">
                  {post.author?.username || "Unknown"}
                </span>
                <span className="text-base text-gray-400">
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={`font-normal text-sm px-2.5 py-0.5 h-5 ${getCategoryStyles(
                    post.category
                  )}`}
                >
                  {post.category === "items" ? "Item" : post.category}
                </Badge>

                {post.category === "items" && post.status === "available" && (
                  <Badge className="font-normal text-sm px-2.5 py-0.5 h-5 text-emerald-600 bg-emerald-50">
                    Available
                  </Badge>
                )}
                {post.category === "items" && post.status === "donated" && (
                  <Badge className="font-normal text-xs px-2.5 py-0.5 h-5 bg-emerald-600 text-white hover:bg-emerald-700">
                    Donated
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Follow button - only show if not own post */}
            {user && post.author?._id !== user.id && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center justify-center h-8 transition-colors w-[3.2rem] rounded-xl hover:shadow bg-[#ECEDED] text-gray-500 hover:bg-[#D0D0D0] hover:text-gray-700"
                }`}
              >
                {isFollowing ? (
                  <Check className="size-5" />
                ) : (
                  <Plus className="size-6" />
                )}
              </button>
            )}

            <div className="relative">
              <button
                className="flex items-center justify-center text-gray-400 transition-colors rounded-xl size-8 hover:bg-[#F5F7F7] hover:text-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReportMenu(!showReportMenu);
                }}
              >
                <MoreHorizontal className="size-7" />
              </button>
              {showReportMenu && (
                <div className="absolute right-0 z-10 w-40 py-1 overflow-hidden bg-white top-8 rounded-xl">
                  {user && post.author?._id === user.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-xs text-left text-red-600 transition-colors hover:bg-red-50"
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
                      className="w-full px-4 py-2 text-xs text-left text-gray-600 transition-colors hover:bg-gray-100"
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
          <div className="w-9/12 mb-3 overflow-hidden rounded-2xl">
            <img
              src={getImageUrl(post.image)}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        )}

        {/* --- TITLE --- */}
        <div className="px-1 mb-1 text-gray-900 text-[18px]">
          <p className="line-clamp-1">{extractTextFromHtml(post.title, 70)}</p>
        </div>

        {/* --- TEXT CONTENT --- */}
        <div className="px-1 mb-2">
          <p className="text-gray-400 text-[16px] leading-relaxed line-clamp-1">
            {extractFirstLineFromHtml(post.description, 80)}
          </p>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-3">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                localIsLiked
                  ? "bg-emerald-50 text-emerald-600 hover:bg-gray-200"
                  : "bg-[#F6F6F6] text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              } ${isLikeAnimating ? "scale-110" : "scale-100"}`}
              onClick={handleReaction}
            >
              <ThumbsUp
                className={`size-4 transition-transform ${
                  localIsLiked ? "fill-current scale-110" : ""
                }`}
              />
              <span>{localLikes > 0 ? localLikes : "Like"}</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 transition-colors bg-[#F6F6F6] rounded-full hover:bg-gray-200 hover:text-gray-900">
              <MessageSquare className="size-4" />
              <span>
                {post.comments?.length > 0 ? post.comments.length : "Comments"}
              </span>
            </button>
          </div>

          <button
            onClick={handleSavePost}
            disabled={saveLoading}
            className={`py-2 px-4 transition-colors rounded-2xl ${
              isSaved
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "text-gray-400 hover:bg-gray-200 bg-[#F6F6F6] hover:text-gray-900"
            }`}
          >
            <Bookmark className={`size-5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>
      </Link>
    </>
  );
}
