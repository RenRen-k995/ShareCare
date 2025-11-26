import React from "react";
import { Link } from "react-router-dom";
import { Bell, Plus } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown"; // Import the new component

export default function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-8 py-4 bg-white">
      {/* Left side - Placeholder for Breadcrumbs or Title */}
      <div className="flex-1"></div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-slate-50">
          <Bell className="w-6 h-6" strokeWidth={2} />
          <span className="absolute w-2 h-2 bg-red-500 border border-white rounded-full top-2 right-2"></span>
        </button>

        {/* New Post Button */}
        <Link to="/posts/new">
          <button className="flex items-center justify-center w-10 h-10 text-gray-600 transition-all bg-gray-100 rounded-full hover:bg-gray-200">
            <Plus className="w-6 h-6" strokeWidth={2} />
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
