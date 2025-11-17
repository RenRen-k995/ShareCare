import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';
import reportService from '../services/reportService';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(post._id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleReport = async (reason) => {
    if (!user) return;
    try {
      await reportService.createReport({
        post: post._id,
        reason,
        description: `Report from feed`
      });
      alert('Report submitted successfully');
      setShowReportDialog(false);
    } catch (error) {
      alert('Failed to submit report');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'items': 'bg-blue-100 text-blue-800',
      'knowledge': 'bg-green-100 text-green-800',
      'emotional-support': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['other'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'donated': 'bg-blue-100 text-blue-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['available'];
  };

  const userReacted = user && post.reactions?.some(r => r.user === user.id);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {post.image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={`${API_URL}${post.image}`}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
              {post.status}
            </span>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReportDialog(!showReportDialog)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardTitle className="line-clamp-1">{post.title}</CardTitle>
        <CardDescription className="line-clamp-2">{post.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>by {post.author?.username || 'Unknown'}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button
              variant={userReacted ? "default" : "outline"}
              size="sm"
              onClick={handleReaction}
              disabled={!user}
            >
              <Heart className="h-4 w-4 mr-1" fill={userReacted ? "currentColor" : "none"} />
              {post.reactions?.length || 0}
            </Button>
            <Link to={`/posts/${post._id}`}>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
          </div>
        </div>
        {showReportDialog && (
          <div className="w-full p-2 bg-gray-50 rounded border space-y-1">
            <p className="text-xs font-medium mb-1">Report this post:</p>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" onClick={() => handleReport('spam')}>Spam</Button>
              <Button size="sm" variant="outline" onClick={() => handleReport('inappropriate')}>Inappropriate</Button>
              <Button size="sm" variant="outline" onClick={() => handleReport('scam')}>Scam</Button>
              <Button size="sm" variant="outline" onClick={() => handleReport('other')}>Other</Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
