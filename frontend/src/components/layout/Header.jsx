import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Plus, Heart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const location = useLocation();
  const isSettingsPage = location.pathname === "/settings";

  return (
    <header className="flex items-center justify-between h-[4.5rem] px-8 py-4 bg-white">
      {/* Left side - Only show Logo on Settings page */}
      <div className="flex items-center min-w-[200px]">
        {isSettingsPage && (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center size-10 bg-emerald-600 rounded-xl transition-transform group-hover:scale-105">
              <Heart className="size-6 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ShareCare</span>
          </Link>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="size-6" strokeWidth={2} />
          <span className="absolute size-2 bg-red-500 rounded-full top-2 right-2" />
        </button>

        {/* New Post Button */}
        <Link to="/posts/new">
          <button className="flex items-center justify-center size-10 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Plus className="size-6" strokeWidth={2} />
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
