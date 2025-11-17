import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleReaction = async () => {
    if (!user) return;
    try {
      await postService.toggleReaction(post._id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
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
      <CardFooter className="flex justify-between">
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
      </CardFooter>
    </Card>
  );
}
