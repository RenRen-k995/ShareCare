import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import authService from "../services/authService";
import MainLayout from "../components/layout/MainLayout";
import PostCard from "../components/PostCard";
import { Avatar, PageLoadingState, EmptyState } from "../components/common";
import {
  Calendar,
  Edit3,
  LayoutGrid,
  Heart,
  MessageSquare,
  User as UserIcon,
  Bookmark,
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function Profile() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user?.id || user?._id) {
        try {
          setLoading(true);
          const userId = user.id || user._id;
          // Fetching posts specific to this user
          const data = await postService.getPosts({ author: userId });
          setUserPosts(data.posts || []);
        } catch (error) {
          console.error("Failed to fetch user posts", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserPosts();
  }, [user]);

  // Fetch saved posts when tab changes to saved
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (activeTab === "saved" && user) {
        try {
          setSavedLoading(true);
          const data = await authService.getSavedPosts();
          setSavedPosts(data.posts || []);
        } catch (error) {
          console.error("Failed to fetch saved posts", error);
        } finally {
          setSavedLoading(false);
        }
      }
    };

    fetchSavedPosts();
  }, [activeTab, user]);

  const handleDeletePost = (postId) => {
    setUserPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
  };

  const handleRemoveSavedPost = (postId) => {
    setSavedPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
  };

  if (!user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    // We pass 'null' to rightSidebar to override the default one,
    // because we are building a custom 2-column layout inside this page
    <MainLayout rightSidebar={null}>
      <div className="pt-5 pb-20 pr-14">
        {/* --- 1. Profile Header & Banner --- */}
        <div className="mb-5 overflow-hidden bg-white rounded-2xl">
          {/* Banner Area */}
          <div className="relative w-full h-48 overflow-hidden bg-gradient-to-r from-emerald-100 via-teal-100 to-blue-100">
            {/* Decorative patterns */}
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Heart className="transform size-64 text-cyan-600 rotate-12" />
            </div>
            <div className="absolute bottom-0 left-10 opacity-10">
              <LayoutGrid className="text-blue-600 size-32" />
            </div>
          </div>

          {/* Profile Info Row */}
          <div className="flex items-start gap-6 px-8 py-4">
            {/* Avatar - positioned to overlap banner */}
            <div className="relative -mt-16 shrink-0">
              <div className="relative z-10 bg-white rounded-full size-32">
                <Avatar
                  src={user.avatar}
                  alt={user.username}
                  fallback={user.username}
                  size="3xl"
                  className="w-full h-full rounded-full"
                />
              </div>
            </div>

            {/* Name & Stats - grows to fill space */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Name row with button */}
              <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  {user.fullName || user.username}
                  {/* Gender Icon */}
                  {user.gender === "male" && (
                    <span className="text-blue-500" title="Male">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="10" cy="14" r="7" />
                        <line x1="14.5" y1="9.5" x2="21" y2="3" />
                        <line x1="17" y1="3" x2="21" y2="3" />
                        <line x1="21" y1="3" x2="21" y2="7" />
                      </svg>
                    </span>
                  )}
                  {user.gender === "female" && (
                    <span className="text-pink-500" title="Female">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="7" />
                        <line x1="12" y1="15" x2="12" y2="23" />
                        <line x1="8" y1="19" x2="16" y2="19" />
                      </svg>
                    </span>
                  )}
                  {user.gender === "other" && (
                    <span className="text-purple-500" title="Other">
                      <UserIcon className="size-4" />
                    </span>
                  )}
                </h1>

                {/* Follow/Edit Button - aligned with name */}
                <Link to="/settings" className="pt-1 shrink-0">
                  <Button className="h-12 px-4 text-base font-semibold text-gray-500 rounded-2xl bg-[#ECEDED] hover:bg-gray-300 hover:text-gray-900">
                    <Edit3 className="mr-2 size-5" />
                    Edit Profile
                  </Button>
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-1 text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {user.totalLikes || 0}
                  </span>
                  <span>Likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {user.following?.length || 0}
                  </span>
                  <span>Following</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {user.followers?.length || 0}
                  </span>
                  <span>Followers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. Main Content Grid --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN: Tabs & Feed (2/3 width) */}
          <div className="pt-3 lg:col-span-2">
            {/* Tabs */}
            <div className="flex items-center gap-8 px-2 mb-3 border-b border-gray-100">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-3 text-lg font-bold transition-colors relative ${
                  activeTab === "posts"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Post
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 rounded-full bg-emerald-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-3 text-lg font-bold transition-colors relative ${
                  activeTab === "comments"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Comments
                {activeTab === "comments" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 rounded-full bg-emerald-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`pb-3 text-lg font-bold transition-colors relative ${
                  activeTab === "saved"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Saved
                {activeTab === "saved" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Feed Content */}
            {activeTab === "posts" &&
              (loading ? (
                <PageLoadingState message="Loading posts..." />
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No posts yet"
                  className="rounded-[1.2rem] border border-dashed border-gray-200"
                />
              ))}

            {activeTab === "comments" && (
              <EmptyState
                title="No comments yet"
                className="rounded-[1.2rem] border border-dashed border-gray-200"
              />
            )}

            {activeTab === "saved" &&
              (savedLoading ? (
                <PageLoadingState message="Loading saved posts..." />
              ) : savedPosts.length > 0 ? (
                <div className="space-y-4">
                  {savedPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onDelete={handleRemoveSavedPost}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Bookmark className="w-12 h-12 text-gray-300" />}
                  title="No saved posts"
                  description="Posts you save will appear here"
                  className="rounded-[1.2rem] border border-dashed border-gray-200"
                />
              ))}
          </div>

          {/* RIGHT COLUMN: Info & Widgets (1/3 width) */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white p-6 rounded-[1.2rem] border border-gray-100">
              <h3 className="mb-4 text-xl font-medium text-gray-900">
                Personal Information
              </h3>

              <div className="mb-4 space-y-4">
                <div className="flex items-start gap-3 text-lg text-gray-400">
                  <MessageSquare className="w-5 h-5 mt-0.5 text-gray-400 shrink-0" />
                  <p className="leading-relaxed break-all">
                    {user.bio || "No bio yet"}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-lg text-gray-400">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
              <div className="h-px mx-4 bg-gray-200" />
              <div className="pt-4 mt-2 font-mono text-base text-gray-400 border-t border-gray-50">
                ID: {user.id || user._id}
              </div>
            </div>

            {/* Creation Center Widget */}
            <div className="bg-white p-6 rounded-[1.2rem] border border-gray-100">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Creation Center
              </h3>
              <Link to="/posts/new">
                <Button className="w-full h-12 text-base font-bold text-gray-500 bg-[#ECEDED] border-0 rounded-full hover:bg-gray-300 hover:text-gray-900">
                  <Edit3 className="w-5 h-5 mr-2" />
                  My creations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
