import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import CreatorProfile from "../components/CreatorProfile";
import MainLayout from "../components/layout/MainLayout";
import { extractTextFromHtml } from "../utils/htmlUtils";
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  ChevronDown,
  Image as ImageIcon,
  Smile,
  Send,
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState("newest");

  // Refs for sticky footer logic
  const commentInputRef = useRef(null);
  const [showStickyFooter, setShowStickyFooter] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          postService.getPost(id),
          commentService.getCommentsByPost(id),
        ]);
        setPost(postData.post);
        setComments(commentsData.comments || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show sticky footer if we have scrolled PAST the input (top is negative)
        // and it is no longer intersecting
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setShowStickyFooter(true);
        } else {
          setShowStickyFooter(false);
        }
      },
      {
        threshold: 0,
        // Adjust rootMargin if you want it to appear slightly earlier/later
        rootMargin: "0px",
      }
    );

    if (commentInputRef.current) {
      observer.observe(commentInputRef.current);
    }

    return () => {
      if (commentInputRef.current) {
        observer.unobserve(commentInputRef.current);
      }
    };
  }, [loading]); // Re-run when loading finishes so ref exists

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    try {
      await commentService.createComment({ post: id, content: newComment });
      setNewComment("");
      const data = await commentService.getCommentsByPost(id);
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(id);
      const data = await postService.getPost(id);
      setPost(data.post);
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!post) return <div className="p-10 text-center">Post not found</div>;

  const userReacted = user && post.reactions?.some((r) => r.user === user.id);

  return (
    <MainLayout rightSidebar={<CreatorProfile author={post.author} />}>
      <div className="pb-32">
        {/* --- Sticky Article Header --- */}
        {/* Added background and z-index to sit on top of content when scrolling */}
        <div className="sticky top-0 z-20 pt-6 pb-4 bg-[#F5F7F7]">
          {/* Added ml-8 to align with the p-8 padding of the card below */}
          <h2 className="ml-8 text-sm font-bold tracking-wide text-gray-500 uppercase">
            Article Details
          </h2>
        </div>

        {/* --- Main Article Card --- */}
        <div className="bg-white rounded-[2rem] p-8 mb-6 shadow-sm border border-gray-100">
          {/* Title */}
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center mb-8 text-xs font-medium tracking-wide text-gray-400">
            <span>{formatDate(post.createdAt)}</span>
            <span className="mx-2">·</span>
            <span className="text-gray-500 uppercase">{post.category}</span>
            <span className="mx-2">·</span>
            <span>{post.viewCount || 0} views</span>
          </div>

          {/* Image */}
          {post.image && (
            <div className="w-full aspect-[2.1] rounded-lg overflow-hidden bg-gray-100 mb-8 border border-gray-100">
              <img
                src={`${API_URL}${post.image}`}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Content Body */}
          <div className="mb-12 leading-relaxed prose prose-lg text-gray-800 max-w-none">
            <p className="whitespace-pre-wrap">
              {extractTextFromHtml(post.description, 5000)}
            </p>
          </div>

          {/* Reaction Buttons */}
          <div className="flex justify-center gap-4 pt-8 border-t border-gray-50">
            <button
              onClick={handleReaction}
              className={`flex items-center gap-2 px-10 py-3 rounded-full transition-all duration-200 ${
                userReacted
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
              }`}
            >
              <ThumbsUp
                className={`w-5 h-5 ${userReacted ? "fill-current" : ""}`}
              />
              <span className="text-lg font-bold">
                {post.reactions?.length || 0}
              </span>
            </button>

            <button className="flex items-center gap-2 px-10 py-3 text-gray-600 transition-all bg-gray-100 border border-transparent rounded-full hover:bg-gray-200">
              <Bookmark className="w-5 h-5" />
              <span className="text-lg font-bold">Save</span>
            </button>
          </div>
        </div>

        {/* --- Comments Section --- */}

        {/* 1. Main Inline Input */}
        <div
          ref={commentInputRef}
          className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border border-gray-100"
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 overflow-hidden bg-gray-100 border rounded-full shrink-0 border-gray-50">
              {user?.avatar ? (
                <img src={user.avatar} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full font-bold text-gray-400">
                  {user?.username?.[0]}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Come share your thoughts!"
                className="w-full bg-gray-50 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:bg-white transition-all resize-none h-12 min-h-[48px] text-gray-700 placeholder:text-gray-400"
              />
              <div className="absolute flex gap-3 text-gray-400 right-3 top-3">
                <Smile className="w-5 h-5 transition-colors cursor-pointer hover:text-gray-600" />
                <ImageIcon className="w-5 h-5 transition-colors cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            {newComment.trim() && (
              <Button
                onClick={handleCommentSubmit}
                size="icon"
                className="w-12 h-12 rounded-full bg-cyan-400 hover:bg-cyan-500 shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </div>

        {/* 2. Comments List Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            All Comments{" "}
            <span className="ml-1 text-sm font-normal text-gray-400">
              {comments.length}
            </span>
          </h3>
          <button
            onClick={() =>
              setSortMethod((prev) => (prev === "newest" ? "top" : "newest"))
            }
            className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            {sortMethod === "newest" ? "Newest" : "Top"}{" "}
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>

        {/* 3. Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="py-10 text-sm text-center text-gray-400">
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="p-5 bg-white border shadow-sm rounded-2xl border-gray-50"
              >
                <div className="flex gap-4">
                  <div className="overflow-hidden bg-gray-100 rounded-full w-9 h-9 shrink-0">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-400">
                        {comment.author?.username?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">
                        {comment.author?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-[15px] leading-relaxed mb-3">
                      {comment.content}
                    </p>

                    {/* Comment Actions */}
                    <div className="flex gap-6">
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Like</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- 4. Sticky Footer Input (Only visible after scrolling past main input) --- */}
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-3xl transition-all duration-300 z-50 ${
            showStickyFooter
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 p-2 pl-3 border border-gray-200 rounded-full shadow-xl bg-white/90 backdrop-blur-md">
            <div className="w-8 h-8 overflow-hidden bg-gray-200 rounded-full shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-500">
                  {user?.username?.[0]}
                </div>
              )}
            </div>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Come share your thoughts!"
              className="flex-1 px-2 text-sm text-gray-700 bg-transparent focus:outline-none"
            />
            <div className="flex items-center gap-3 pr-3 text-gray-400">
              <Smile className="w-5 h-5 cursor-pointer hover:text-gray-600" />
              {newComment.trim() ? (
                <Button
                  onClick={handleCommentSubmit}
                  size="sm"
                  className="h-8 px-4 text-xs font-bold text-white rounded-full bg-cyan-400 hover:bg-cyan-500"
                >
                  Post
                </Button>
              ) : (
                <ImageIcon className="w-5 h-5 cursor-pointer hover:text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
