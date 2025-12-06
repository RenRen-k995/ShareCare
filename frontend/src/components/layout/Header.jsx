import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Plus, Heart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const location = useLocation();
  const isSettingsPage = location.pathname === "/settings";

  return (
    <header className="flex items-center justify-between h-[5.3rem] px-8 py-4 bg-white">
      {/* Left side - Only show Logo on Settings page */}
      <div className="flex items-center min-w-[200px]">
        {isSettingsPage && (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center transition-transform size-10 bg-emerald-600 rounded-xl group-hover:scale-105">
              <Heart className="text-white size-6" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ShareCare</span>
          </Link>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative flex p-3 justify-center text-gray-500 transition-colors rounded-3xl bg-[#F6F6F6] size-12 hover:bg-gray-200 hover:text-gray-900">
          <Bell className="size-7" strokeWidth={2} />
          <span className="absolute right-0 bg-orange-500 rounded-full top-1 size-[0.6rem]" />
        </button>

        {/* New Post Button */}
        <Link to="/posts/new">
          <button className="flex items-center justify-center text-gray-500 transition-colors bg-[#F6F6F6] rounded-2xl size-12 hover:bg-gray-200 hover:text-gray-900">
            <Plus className="size-8" strokeWidth={2} />
          </button>
        </Link>

        {/* Profile Dropdown */}
        <div className="pl-2">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
