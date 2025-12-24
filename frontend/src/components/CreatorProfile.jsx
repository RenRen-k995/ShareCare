import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar } from "./common";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";

export default function CreatorProfile({ author }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(
    author?.followers?.length || 0
  );

  useEffect(() => {
    if (user && author?._id) {
      setIsFollowing(user.following?.includes(author._id));
      setFollowerCount(author?.followers?.length || 0);
    }
  }, [user, author]);

  if (!author) return null;

  const handleAvatarClick = () => {
    if (author._id) {
      if (user && author._id === user.id) {
        navigate("/profile");
      } else {
        navigate(`/user/${author._id}`);
      }
    }
  };

  const handleFollow = async () => {
    if (!user || !author._id || author._id === user.id) return;

    setFollowLoading(true);
    const previousIsFollowing = isFollowing;
    const previousCount = followerCount;

    setIsFollowing(!previousIsFollowing);
    setFollowerCount(
      previousIsFollowing ? previousCount - 1 : previousCount + 1
    );

    try {
      const result = await authService.toggleFollow(author._id);
      // Update user in localStorage
      const updatedUser = {
        ...user,
        following: result.isFollowing
          ? [...(user.following || []), author._id]
          : (user.following || []).filter((id) => id !== author._id),
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

  const isOwnProfile = user && author._id === user.id;

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="mb-6 text-xl font-bold text-gray-900">
          Creator Profile
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAvatarClick}
              className="hover:ring-2 hover:ring-emerald-300 rounded-full transition-all"
            >
              <Avatar
                src={author.avatar}
                alt={author.username}
                fallback={author.username}
                size="lg"
              />
            </button>
            <div>
              <button onClick={handleAvatarClick} className="hover:underline">
                <h4 className="text-lg font-medium text-gray-900">
                  {author.fullName || author.username}
                </h4>
              </button>
            </div>
          </div>

          {!isOwnProfile && (
            <Button
              size="icon"
              onClick={handleFollow}
              disabled={followLoading}
              className={`shadow-sm h-9 rounded-2xl w-14 ${
                isFollowing
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-cyan-400 hover:bg-cyan-500 text-white"
              }`}
            >
              {isFollowing ? (
                <Check className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </Button>
          )}
        </div>

        <p className="pt-2 mb-4 text-base leading-relaxed text-gray-500">
          {author.bio || "No bio yet."}
        </p>

        <div className="flex items-center justify-center gap-2 px-1">
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-gray-900">
              {author.totalLikes || 0}
            </div>
            <div className="text-sm font-normal tracking-wide text-gray-400">
              Likes
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-gray-900">
              {followerCount}
            </div>
            <div className="text-sm font-normal tracking-wide text-gray-400">
              Followers
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-gray-900">
              {author.following?.length || 0}
            </div>
            <div className="text-sm font-normal tracking-wide text-gray-400">
              Following
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
