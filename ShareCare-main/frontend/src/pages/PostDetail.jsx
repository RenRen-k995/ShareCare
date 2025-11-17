import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import commentService from "../services/commentService";
import chatService from "../services/chatService";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import Navbar from "../components/Navbar";
import {
  Heart,
  MessageCircle,
  Trash2,
  Edit,
  MessageSquare,
} from "lucide-react";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await postService.getPost(id);
      setPost(data.post);
    } catch (err) {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await commentService.getCommentsByPost(id);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(id);
      fetchPost();
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await commentService.createComment({ post: id, content: newComment });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await postService.deletePost(id);
      navigate("/");
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  const handleContactOwner = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const response = await chatService.getOrCreateChat(post.author._id, id);
      navigate(`/chat?chatId=${response.chat._id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!user || !isAuthor) return;

    try {
      await postService.updatePostStatus(id, newStatus);
      setPost({ ...post, status: newStatus });

      if (newStatus === "donated") {
        alert("Post marked as donated! It will be hidden from the main feed.");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update post status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl px-4 py-8 mx-auto">
          <div className="p-4 text-red-600 rounded-lg bg-red-50">
            {error || "Post not found"}
          </div>
        </div>
      </div>
    );
  }

  const userReacted = user && post.reactions?.some((r) => r.user === user.id);
  const isAuthor = user && post.author?._id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl px-4 py-8 mx-auto">
        <Card>
          {post.image && (
            <div className="w-full overflow-hidden max-h-96">
              <img
                src={`${API_URL}${post.image}`}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                    {post.category}
                  </span>
                  {isAuthor ? (
                    <Select
                      value={post.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-[140px] h-auto py-1 px-3 text-sm rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="donated">Donated</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        post.status === "donated"
                          ? "text-gray-800 bg-gray-100"
                          : post.status === "pending"
                          ? "text-yellow-800 bg-yellow-100"
                          : "text-green-800 bg-green-100"
                      }`}
                    >
                      {post.status}
                    </span>
                  )}
                </div>
                <CardTitle className="mb-2 text-3xl">{post.title}</CardTitle>
                <div className="text-sm text-gray-600">
                  Posted by {post.author?.username || "Unknown"} on{" "}
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {post.description}
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant={userReacted ? "default" : "outline"}
                onClick={handleReaction}
                disabled={!user}
              >
                <Heart
                  className="w-4 h-4 mr-2"
                  fill={userReacted ? "currentColor" : "none"}
                />
                {post.reactions?.length || 0} Reactions
              </Button>
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                {comments.length} Comments
              </Button>
              {!isAuthor && user && post.status === "available" && (
                <Button onClick={handleContactOwner} variant="default">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact to Receive
                </Button>
              )}
            </div>

            {/* Comments Section */}
            <div className="pt-6 border-t">
              <h3 className="mb-4 text-xl font-semibold">Comments</h3>

              {user && (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button type="submit" disabled={!newComment.trim()}>
                    Post Comment
                  </Button>
                </form>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="p-4 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {comment.author?.username || "Unknown"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
