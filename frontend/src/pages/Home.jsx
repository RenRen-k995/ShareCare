import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import PostCard from "../components/PostCard";
import MainLayout from "../components/layout/MainLayout";
import CreatePostWidget from "../components/CreatePostWidget";
import { ErrorMessage, EmptyState, PageLoadingState } from "../components/common";
import { Button } from "../components/ui/button";

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
      <div className="py-5">
        {/* Create Post Widget */}
        {user && <CreatePostWidget />}

        {/* Error Message */}
        <ErrorMessage message={error} className="mb-6 rounded-xl" />

        {/* Posts Feed */}
        {loading ? (
          <PageLoadingState message="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts found"
            action={
              user && (
                <Link to="/posts/new">
                  <Button className="px-6 py-3 font-semibold text-white transition-all rounded-full shadow-md bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg">
                    Create the first post
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-1">
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
