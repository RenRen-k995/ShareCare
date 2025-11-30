import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import chatService from "../services/chatService";
import exchangeService from "../services/exchangeService";
import CreatorProfile from "../components/CreatorProfile";
import MainLayout from "../components/layout/MainLayout";
import ExchangeRequestModal from "../components/chat/ExchangeRequestModal";
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  ChevronDown,
  Image as ImageIcon,
  Smile,
  Send,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { formatTimeAgo } from "../lib/utils";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState("newest");
  const [activeCommentMenu, setActiveCommentMenu] = useState(null); // Track open menu
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Refs for sticky footer logic
  const commentInputRef = useRef(null);
  const mainTextareaRef = useRef(null);
  const stickyTextareaRef = useRef(null);
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
    console.log("showRequestModal changed to:", showRequestModal);
  }, [showRequestModal]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky footer ONLY when the main comment input is NOT visible
        setShowStickyFooter(
          !entry.isIntersecting && entry.boundingClientRect.top < 0
        );
      },
      { threshold: 0 }
    );

    const currentRef = commentInputRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Click outside to close menus
    const handleClickOutside = () => setActiveCommentMenu(null);
    document.addEventListener("click", handleClickOutside);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      document.removeEventListener("click", handleClickOutside);
    };
  }, [loading]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    try {
      await commentService.createComment({ post: id, content: newComment });
      setNewComment("");
      // Reset textarea heights
      if (mainTextareaRef.current) {
        mainTextareaRef.current.style.height = "auto";
      }
      if (stickyTextareaRef.current) {
        stickyTextareaRef.current.style.height = "auto";
      }
      const data = await commentService.getCommentsByPost(id);
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) return;
    try {
      const data = await commentService.toggleLike(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, likes: data.comment.likes } : c
        )
      );

      // If liking own comment, update user's totalLikes
      const comment = comments.find((c) => c._id === commentId);
      if (
        comment &&
        comment.author._id === user.id &&
        data.authorTotalLikes !== undefined
      ) {
        updateUser({ ...user, totalLikes: data.authorTotalLikes });
      }
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Failed to delete comment");
    }
  };

  const handleReaction = async () => {
    if (!user) return;
    try {
      // Optimistic Update for Post
      const isLiked = post.reactions.some((r) => r.user === user.id);
      const newReactions = isLiked
        ? post.reactions.filter((r) => r.user !== user.id)
        : [...post.reactions, { user: user.id, type: "like" }];

      // Calculate new total likes for author (Visual sync)
      const newTotalLikes = (post.author.totalLikes || 0) + (isLiked ? -1 : 1);

      setPost((prev) => ({
        ...prev,
        reactions: newReactions,
        author: {
          ...prev.author,
          totalLikes: newTotalLikes,
        },
      }));

      await postService.toggleReaction(id);
    } catch (error) {
      console.error(error);
      // Could revert state here on error
    }
  };

  const handleContactToReceive = () => {
    if (!user) return;
    setShowRequestModal(true);
  };

  const handleExchangeRequest = async (message) => {
    try {
      // Ensure message is never empty - use default if needed
      const defaultMessage = `Hi! I'm interested in "${post.title}". Is it still available?`;
      const finalMessage = message && message.trim() ? message : defaultMessage;

      console.log("1. Starting exchange request with message:", finalMessage);

      // 1. Get or Create Chat Room
      const chatData = await chatService.getOrCreateChat(
        post.author._id,
        post._id
      );
      const chatId = chatData.chat._id;
      console.log("2. Chat created/retrieved:", chatId);

      // 2. Create Exchange Request FIRST
      const exchangeData = await exchangeService.createExchange(
        chatId,
        post._id
      );
      console.log("3. Exchange created:", exchangeData);

      // 3. Send the message
      const messageResponse = await chatService.sendMessage(
        chatId,
        finalMessage
      );
      console.log("4. Message sent successfully:", messageResponse);

      // 4. Wait longer for message to be saved in database (2 seconds)
      console.log("5. Waiting 2 seconds for DB sync...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 5. Navigate with timestamp to force fresh load
      console.log("6. Navigating to chat...");
      navigate(`/chat?chatId=${chatId}&refresh=${Date.now()}`);
    } catch (error) {
      console.error("Failed to create exchange request:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setShowRequestModal(false);
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
        {/* ... Header & Card ... */}
        <div className="sticky top-0 z-20 pt-6 pb-4 bg-[#F5F7F7]">
          <h2 className="ml-8 text-sm font-bold tracking-wide text-gray-500 uppercase">
            Article Details
          </h2>
        </div>

        <div className="bg-white rounded-[2rem] p-8 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-row justify-between">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              {/* Contact Button for Available Items */}
              {post.category === "items" &&
                post.status === "available" &&
                user &&
                post.author?._id !== user.id && (
                  <button
                    onClick={handleContactToReceive}
                    className="flex items-center gap-2 px-6 py-2 text-xs font-semibold text-white transition-all bg-black rounded-full shadow-md hover:bg-gray-800 hover:shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    <span>Contact</span>
                  </button>
                )}
            </div>
          </div>

          <div className="flex items-center mb-8 text-xs font-medium tracking-wide text-gray-400">
            <span>{formatDate(post.createdAt)}</span>
            <span className="mx-2">·</span>
            <span className="text-gray-500 uppercase">{post.category}</span>
            <span className="mx-2">·</span>
            <div className="flex items-center gap-2">
              {post.category === "items" && post.status === "available" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-full text-emerald-600 border-emerald-200 bg-emerald-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Available
                </div>
              )}
              {post.category === "items" && post.status === "unavailable" && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-500 border border-blue-500 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Donated
                </div>
              )}
            </div>
            <span className="mx-2">·</span>
            <span>{post.viewCount || 0} views</span>
          </div>

          {post.image && (
            <div className="w-full aspect-[2.1] rounded-2xl overflow-hidden bg-gray-100 mb-10 shadow-md border border-gray-100">
              <img
                src={`${API_URL}${post.image}`}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div
            className="mb-12 leading-relaxed prose prose-lg text-gray-800 max-w-none [&_img]:max-w-[600px] [&_img]:w-[60%] [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 [&_img]:mx-auto [&_img]:block [&_img]:shadow-md [&_img]:border [&_img]:border-gray-100"
            dangerouslySetInnerHTML={{ __html: post.description }}
          />

          {/* Main Post Reaction Buttons */}
          <div className="flex justify-center gap-4 pt-10 mt-2 border-t border-gray-100">
            <button
              onClick={handleReaction}
              className={`flex items-center justify-center gap-3 px-12 py-3 rounded-3xl transition-all duration-200 font-medium shadow-sm w-56 ${
                userReacted
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-500 hover:shadow-md"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              <ThumbsUp
                className={`w-5 h-5 ${userReacted ? "fill-current" : ""}`}
              />
              <span className="text-lg font-bold">
                {post.reactions?.length || 0}
              </span>
            </button>

            <button className="flex items-center justify-center w-56 gap-3 px-12 font-medium text-gray-500 transition-all border border-gray-200 shadow-sm bg-gray-50 rounded-3xl hover:bg-gray-100 hover:border-gray-300 hover:shadow-md hover:text-gray-800">
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
          {/* ... Input Code ... */}
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
                ref={mainTextareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="Share your thoughts..."
                className="w-full bg-gray-50 rounded-[1.2rem] px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none min-h-[48px] text-gray-700 placeholder:text-gray-400 border-2 border-transparent focus:border-emerald-400 overflow-hidden"
                rows={1}
              />
              <div className="absolute flex gap-3 text-gray-400 right-3 top-3">
                <Smile className="w-5 h-5 transition-colors cursor-pointer hover:text-yellow-500" />
                <ImageIcon className="w-5 h-5 transition-colors cursor-pointer hover:text-blue-500" />
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
            comments.map((comment) => {
              const isLiked = comment.likes?.includes(user?.id || user?._id);
              const likeCount = comment.likes?.length || 0;
              const isOwner =
                user &&
                (user.id === comment.author?._id ||
                  user._id === comment.author?._id);

              return (
                <div
                  key={comment._id}
                  className="p-5 bg-white border shadow-sm rounded-2xl border-gray-50 group"
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {comment.author?.username}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>

                        {/* 3 Dots Menu */}
                        {isOwner && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentMenu(
                                  activeCommentMenu === comment._id
                                    ? null
                                    : comment._id
                                );
                              }}
                              className="p-1 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {activeCommentMenu === comment._id && (
                              <div className="absolute right-0 z-10 py-1 mt-1 bg-white border border-gray-100 shadow-xl w-28 rounded-xl animate-in fade-in zoom-in-95">
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment._id)
                                  }
                                  className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Comment Actions - Updated Wrapper Color */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isLiked
                              ? "text-cyan-500 hover:bg-[#F5F7F7]"
                              : "text-gray-500 hover:bg-[#F5F7F7] hover:text-gray-700"
                          }`}
                        >
                          <ThumbsUp
                            className={`w-3.5 h-3.5 ${
                              isLiked ? "fill-current" : ""
                            }`}
                          />
                          <span>{likeCount > 0 ? likeCount : "Like"}</span>
                        </button>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:bg-[#F5F7F7] hover:text-gray-700 transition-all">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ... Sticky Footer ... */}
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-3xl transition-all duration-300 z-50 ${
            showStickyFooter
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`flex items-end gap-3 p-3 border-2 rounded-2xl shadow-xl bg-white/95 backdrop-blur-md transition-all ${
              newComment.trim() ? "border-emerald-400" : "border-gray-200"
            }`}
          >
            <div className="w-8 h-8 overflow-hidden bg-gray-200 rounded-full shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-500">
                  {user?.username?.[0]}
                </div>
              )}
            </div>
            <textarea
              ref={stickyTextareaRef}
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              placeholder="Come share your thoughts!"
              className="flex-1 px-2 py-1 text-sm text-gray-700 bg-transparent resize-none focus:outline-none max-h-[120px] overflow-y-auto"
              rows={1}
            />
            <div className="flex items-center gap-3 pb-1">
              <Smile className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-500" />
              {newComment.trim() ? (
                <Button
                  onClick={handleCommentSubmit}
                  size="sm"
                  className="h-8 px-4 text-xs font-bold text-white rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Post
                </Button>
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      {showRequestModal && post && (
        <ExchangeRequestModal
          isOpen={showRequestModal}
          post={post}
          onClose={() => setShowRequestModal(false)}
          onConfirm={handleExchangeRequest}
        />
      )}
    </MainLayout>
  );
}
