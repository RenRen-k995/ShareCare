import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';
import commentService from '../services/commentService';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Heart, MessageCircle, Trash2, Edit } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await postService.getPost(id);
      setPost(data.post);
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await commentService.getCommentsByPost(id);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(id);
      fetchPost();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await commentService.createComment({ post: id, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(id);
      navigate('/');
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error || 'Post not found'}
          </div>
        </div>
      </div>
    );
  }

  const userReacted = user && post.reactions?.some(r => r.user === user.id);
  const isAuthor = user && post.author?._id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          {post.image && (
            <div className="w-full max-h-96 overflow-hidden">
              <img
                src={`${API_URL}${post.image}`}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {post.status}
                  </span>
                </div>
                <CardTitle className="text-3xl mb-2">{post.title}</CardTitle>
                <div className="text-sm text-gray-600">
                  Posted by {post.author?.username || 'Unknown'} on{' '}
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant={userReacted ? "default" : "outline"}
                onClick={handleReaction}
                disabled={!user}
              >
                <Heart className="h-4 w-4 mr-2" fill={userReacted ? "currentColor" : "none"} />
                {post.reactions?.length || 0} Reactions
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                {comments.length} Comments
              </Button>
            </div>

            {/* Comments Section */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4">Comments</h3>
              
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
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.author?.username || 'Unknown'}</span>
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
