import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import postService from "../services/postService";
import authService from "../services/authService";
import MainLayout from "../components/layout/MainLayout";
import PostCard from "../components/PostCard";
import { Avatar, PageLoadingState, EmptyState } from "../components/common";
import {
  Calendar,
  LayoutGrid,
  Heart,
  MessageSquare,
  User as UserIcon,
  Plus,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Redirect to own profile if viewing self
        if (
          currentUser &&
          (userId === currentUser.id || userId === currentUser._id)
        ) {
          navigate("/profile", { replace: true });
          return;
        }

        // Fetch user profile
        const userData = await authService.getUserById(userId);
        setProfileUser(userData.user);
        setFollowerCount(userData.user?.followers?.length || 0);

        // Check if following
        if (currentUser) {
          setIsFollowing(currentUser.following?.includes(userId));
        }

        // Fetch user posts
        const postsData = await postService.getPosts({ author: userId });
        setUserPosts(postsData.posts || []);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, currentUser, navigate]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser?._id) return;

    setFollowLoading(true);
    const previousIsFollowing = isFollowing;
    const previousCount = followerCount;

    setIsFollowing(!previousIsFollowing);
    setFollowerCount(
      previousIsFollowing ? previousCount - 1 : previousCount + 1
    );

    try {
      const result = await authService.toggleFollow(profileUser._id);
      // Update user in localStorage
      const updatedUser = {
        ...currentUser,
        following: result.isFollowing
          ? [...(currentUser.following || []), profileUser._id]
          : (currentUser.following || []).filter(
              (id) => id !== profileUser._id
            ),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
    } catch {
      setIsFollowing(previousIsFollowing);
      setFollowerCount(previousCount);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout rightSidebar={null}>
        <PageLoadingState message="Loading profile..." />
      </MainLayout>
    );
  }

  if (!profileUser) {
    return (
      <MainLayout rightSidebar={null}>
        <EmptyState
          title="User not found"
          description="The user you're looking for doesn't exist"
        />
      </MainLayout>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <MainLayout rightSidebar={null}>
      <div className="pt-5 pb-20 pr-14">
        {/* --- 1. Profile Header & Banner --- */}
        <div className="mb-5 overflow-hidden bg-white rounded-2xl">
          {/* Banner Area */}
          <div className="relative w-full h-48 overflow-hidden bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Heart className="transform size-64 text-cyan-600 rotate-12" />
            </div>
            <div className="absolute bottom-0 left-10 opacity-10">
              <LayoutGrid className="text-blue-600 size-32" />
            </div>
          </div>

          {/* Profile Info Row */}
          <div className="flex items-start gap-6 px-8 py-4">
            {/* Avatar */}
            <div className="relative -mt-16 shrink-0">
              <div className="relative z-10 bg-white rounded-full size-32">
                <Avatar
                  src={profileUser.avatar}
                  alt={profileUser.username}
                  fallback={profileUser.username}
                  size="3xl"
                  className="w-full h-full rounded-full"
                />
              </div>
            </div>

            {/* Name & Stats */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                  {profileUser.fullName || profileUser.username}
                  {profileUser.gender === "male" && (
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
                  {profileUser.gender === "female" && (
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
                  {profileUser.gender === "other" && (
                    <span className="text-purple-500" title="Other">
                      <UserIcon className="size-4" />
                    </span>
                  )}
                </h1>

                {/* Follow Button */}
                {currentUser && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`h-12 px-6 text-base font-semibold rounded-2xl ${
                      isFollowing
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-cyan-400 hover:bg-cyan-500 text-white"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="mr-2 size-5" />
                        Following
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 size-5" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-1 text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {profileUser.totalLikes || 0}
                  </span>
                  <span>Likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {profileUser.following?.length || 0}
                  </span>
                  <span>Following</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {followerCount}
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
                Posts
                {activeTab === "posts" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Feed Content */}
            {userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No posts yet"
                description="This user hasn't posted anything yet"
                className="rounded-[1.2rem] border border-dashed border-gray-200"
              />
            )}
          </div>

          {/* RIGHT COLUMN: Info (1/3 width) */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white p-6 rounded-[1.2rem] border border-gray-100">
              <h3 className="mb-4 text-xl font-medium text-gray-900">About</h3>

              <div className="mb-4 space-y-4">
                <div className="flex items-start gap-3 text-lg text-gray-400">
                  <MessageSquare className="w-5 h-5 mt-0.5 text-gray-400 shrink-0" />
                  <p className="leading-relaxed break-all">
                    {profileUser.bio || "No bio yet"}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-lg text-gray-400">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>Joined {formatDate(profileUser.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
