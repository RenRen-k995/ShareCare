import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import MainLayout from "../components/layout/MainLayout";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  MapPin,
  Calendar,
  Edit3,
  LayoutGrid,
  Heart,
  MessageSquare,
  Star,
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function Profile() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <div className="px-12 pt-5 pb-20">
        {/* --- 1. Profile Header & Banner --- */}
        <div className="relative mb-6">
          {/* Banner Area */}
          <div className="h-48 w-full rounded-[2rem] bg-gradient-to-r from-emerald-100 via-teal-100 to-blue-100 overflow-hidden relative">
            {/* Decorative patterns */}
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Heart className="w-64 h-64 transform text-emerald-600 rotate-12" />
            </div>
            <div className="absolute bottom-0 left-10 opacity-10">
              <LayoutGrid className="w-32 h-32 text-blue-600" />
            </div>
          </div>

          {/* Profile Info Overlay */}
          <div className="px-8 pb-4">
            <div className="flex items-end justify-between -mt-12">
              <div className="flex items-end gap-5">
                {/* Avatar */}
                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-sm relative z-10">
                  <div className="w-full h-full overflow-hidden border rounded-full bg-slate-100 border-slate-100">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-4xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-500">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Stats */}
                <div className="mb-2">
                  <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    {user.fullName || user.username}
                    {/* ShareCare Gender/Verified icon placeholder */}
                    <span className="text-blue-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20v-9" />
                        <path d="M12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
                        <path d="M12 11l4-4" />
                      </svg>
                    </span>
                  </h1>
                  <div className="flex items-center gap-6 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">
                        {user.ratingCount || 0}
                      </span>{" "}
                      Likes
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">3</span>{" "}
                      Following
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">0</span>{" "}
                      Followers
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Link to="/settings">
                <Button
                  variant="outline"
                  className="mb-4 text-gray-700 border-gray-300 rounded-full hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* --- 2. Main Content Grid --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT COLUMN: Tabs & Feed (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex items-center gap-8 px-2 mb-6 border-b border-gray-100">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-3 text-sm font-bold transition-colors relative ${
                  activeTab === "posts"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Post
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-3 text-sm font-bold transition-colors relative ${
                  activeTab === "comments"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Comments
                {activeTab === "comments" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`pb-3 text-sm font-bold transition-colors relative ${
                  activeTab === "saved"
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Saved
                {activeTab === "saved" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Feed Content */}
            {loading ? (
              <div className="py-10">
                <LoadingSpinner />
              </div>
            ) : userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              // Empty State (Matches reference)
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200">
                <div className="flex items-center justify-center w-32 h-32 mb-4 bg-gray-50 rounded-2xl">
                  <img
                    src="/vite.svg"
                    className="w-12 h-12 opacity-20 grayscale"
                    alt="No content"
                  />
                </div>
                <p className="font-medium text-gray-400">No posts yet</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Info & Widgets (1/3 width) */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Personal Information
              </h3>

              <div className="mb-4 space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400" />
                  <p className="leading-relaxed">{user.bio || "No bio yet"}</p>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
              <div className="h-px mx-4 bg-gray-100" />
              <div className="pt-4 mt-2 font-mono text-xs text-gray-400 border-t border-gray-50">
                ID: {user.id || user._id}
              </div>
            </div>

            {/* Creation Center Widget */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Creation Center
              </h3>
              <Link to="/posts/new">
                <Button className="w-full font-bold text-gray-700 bg-gray-100 border-0 rounded-full shadow-none hover:bg-gray-200">
                  <Edit3 className="w-4 h-4 mr-2" />
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
