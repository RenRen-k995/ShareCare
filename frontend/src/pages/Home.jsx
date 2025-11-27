import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import PostCard from "../components/PostCard";
import MainLayout from "../components/layout/MainLayout";
import CreatePostWidget from "../components/CreatePostWidget";

export default function Home() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};

      // Get category from URL params
      const categoryParam = searchParams.get("category");
      if (categoryParam) {
        params.category = categoryParam;
      }

      // Default to showing available posts
      params.status = "available";

      const data = await postService.getPosts(params);
      setPosts(data.posts || []);
    } catch (err) {
      setError("Failed to load posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <MainLayout>
      <div className="px-8 py-6">
        {/* Create Post Widget */}
        {user && <CreatePostWidget />}

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 text-red-600 bg-red-50 rounded-xl">
            {error}
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center bg-white shadow-sm rounded-2xl">
            <p className="mb-4 text-lg text-gray-600">No posts found</p>
            {user && (
              <Link to="/posts/new">
                <button className="px-6 py-3 font-semibold text-white transition-all rounded-full shadow-md bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg">
                  Create the first post
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={fetchPosts}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
