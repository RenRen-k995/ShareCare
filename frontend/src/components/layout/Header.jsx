import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Plus, Heart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const location = useLocation();
  const isSettingsPage = location.pathname === "/settings";

  return (
    <header className="flex items-center justify-between h-[4.5rem] px-4 md:px-8 py-4 bg-white border-b border-gray-100 neu-card">
      {/* Left side - Only show Logo on Settings page */}
      <div className="flex items-center min-w-0 md:min-w-[200px]">
        {isSettingsPage && (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 transition-transform rounded-xl bg-primary-500 group-hover:scale-105">
              <Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="hidden text-2xl font-bold text-gray-900 md:block">ShareCare</span>
          </Link>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-600 transition-all rounded-full neu-btn">
          <Bell className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
          <span className="absolute w-2 h-2 border border-white rounded-full bg-primary-500 top-2 right-2"></span>
        </button>

        {/* New Post Button */}
        <Link to="/posts/new">
          <button className="flex items-center justify-center w-10 h-10 text-white transition-all rounded-full bg-primary-500 hover:bg-primary-600">
            <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
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
