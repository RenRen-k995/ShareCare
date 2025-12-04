import React from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar } from "./common";

export default function CreatorProfile({ author }) {
  if (!author) return null;

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="mb-6 text-xl font-bold text-gray-900">
          Creator Profile
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar
              src={author.avatar}
              alt={author.username}
              fallback={author.username}
              size="lg"
            />
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                {author.fullName || author.username}
              </h4>
            </div>
          </div>

          <Button
            size="icon"
            className="text-white shadow-sm h-9 rounded-2xl w-14 bg-cyan-400 hover:bg-cyan-500"
          >
            <Plus className="w-6 h-6" />
          </Button>
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
              {author.followers?.length || 0}
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
