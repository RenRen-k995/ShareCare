import React from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";

export default function CreatorProfile({ author }) {
  if (!author) return null;

  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6 text-[15px]">
          Creator Profile
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-yellow-100 border-2 border-white rounded-full shadow-sm">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.username}
                  className="object-cover w-full h-full"
                />
              ) : (
                // Using a playful icon placeholder like the reference
                <span className="text-2xl">🐰</span>
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">
                {author.fullName || author.username}
              </h4>
            </div>
          </div>

          <Button
            size="icon"
            className="text-white rounded-full shadow-sm bg-cyan-400 hover:bg-cyan-500 w-9 h-9"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Official Account Badge */}
        <div className="flex items-center gap-1.5 mb-4 pl-1">
          <div className="bg-cyan-400 rounded-full p-[2px]">
            <Check className="w-2 h-2 text-white" strokeWidth={4} />
          </div>
          <span className="text-xs font-medium text-gray-400">
            Official account
          </span>
        </div>

        <p className="text-[13px] text-gray-500 leading-relaxed mb-8 border-t border-gray-50 pt-4">
          {author.bio || "Mock Bio."}
        </p>

        <div className="flex items-center justify-between px-1">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {author.totalLikes || 0}
            </div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
              Likes
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">280</div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
              Followers
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">0</div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
              Following
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
