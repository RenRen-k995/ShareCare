import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import MainLayout from "../components/layout/MainLayout";
import PostCard from "../components/PostCard";
import { Avatar, PageLoadingState, EmptyState } from "../components/common";
import { Calendar, Edit3, LayoutGrid, Heart, MessageSquare, User as UserIcon } from "lucide-react";
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

  const handleDeletePost = (postId) => {
    setUserPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
  };

  if (!user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <MainLayout rightSidebar={null}>
      <div className="px-4 md:px-16 pt-5 pb-20">
        {/* Profile Header & Banner */}
        <div className="mb-3 overflow-hidden neu-card neu-card-hover rounded-2xl">
          <div className="h-32 md:h-48 w-full rounded-t-2xl bg-primary-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Heart className="w-64 h-64 transform text-primary-600 rotate-12" />
            </div>
            <div className="absolute bottom-0 left-10 opacity-10">
              <LayoutGrid className="w-32 h-32 text-primary-600" />
            </div>
          </div>

          <div className="px-4 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-12 gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white p-1.5 shadow-sm relative z-10">
                  <Avatar
                    src={user.avatar}
                    alt={user.username}
                    fallback={user.username}
                    size="3xl"
                    className="w-full h-full"
                  />
                </div>
                <div className="mb-2">
                  <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900">
                    {user.fullName || user.username}
                    {user.gender === "male" && (
                      <span className="text-primary-500" title="Male">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="10" cy="14" r="7" />
                          <line x1="14.5" y1="9.5" x2="21" y2="3" />
                          <line x1="17" y1="3" x2="21" y2="3" />
                          <line x1="21" y1="3" x2="21" y2="7" />
                        </svg>
                      </span>
                    )}
                    {user.gender === "female" && (
                      <span className="text-pink-500" title="Female">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="7" />
                          <line x1="12" y1="15" x2="12" y2="23" />
                          <line x1="8" y1="19" x2="16" y2="19" />
                        </svg>
                      </span>
                    )}
                    {user.gender === "other" && (
                      <span className="text-purple-500" title="Other">
                        <UserIcon className="w-4 h-4" />
                      </span>
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">{user.totalLikes || 0}</span> Likes
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">3</span> Following
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">0</span> Followers
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/settings">
                <Button variant="outline" className="mb-4 rounded-full">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: Tabs & Feed */}
          <div className="pt-3 lg:col-span-2">
            <div className="flex items-center gap-4 md:gap-8 px-2 mb-3 border-b border-gray-100 overflow-x-auto">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === "posts" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Post
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === "comments" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Comments
                {activeTab === "comments" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("saved")}
                className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                  activeTab === "saved" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Saved
                {activeTab === "saved" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            </div>

            {loading ? (
              <PageLoadingState message="Loading posts..." />
            ) : userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No posts yet"
                className="rounded-2xl border border-dashed border-gray-200"
              />
            )}
          </div>

          {/* Right: Info & Widgets */}
          <div className="space-y-6">
            <div className="neu-card neu-card-hover p-6 rounded-2xl">
              <h3 className="mb-4 text-sm font-bold text-gray-900">Personal Information</h3>
              <div className="mb-4 space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <p className="leading-relaxed break-all">{user.bio || "No bio yet"}</p>
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

            <div className="neu-card neu-card-hover p-6 rounded-2xl">
              <h3 className="mb-4 text-sm font-bold text-gray-900">Creation Center</h3>
              <Link to="/posts/new">
                <Button variant="secondary" className="w-full rounded-full">
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
