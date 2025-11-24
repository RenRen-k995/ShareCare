import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Bell, Plus, LogOut } from "lucide-react";
import { Button } from "../ui/button";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between h-20 px-8 py-4 bg-white 0">
      {/* Left side - Can add breadcrumbs or page title here */}
      <div className="flex-1">
        {/* Empty for now, or add dynamic content */}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-600 transition-colors rounded-full hover:bg-slate-50">
          <Bell className="w-5 h-5" />
          <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1"></span>
        </button>

        {/* New Post Button */}
        <Link to="/posts/new">
          <button className="flex items-center justify-center w-10 h-10 text-white transition-all rounded-full shadow-md bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg">
            <Plus className="w-5 h-5" />
          </button>
        </Link>

        {/* User Avatar & Dropdown */}
        <div className="flex items-center pl-3 space-x-3 border-l border-gray-200">
          <div className="flex items-center px-3 py-2 space-x-2 transition-colors rounded-lg cursor-pointer hover:bg-slate-50 group">
            <div className="flex items-center justify-center text-sm font-semibold text-white rounded-full w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.username || "User"}
              </div>
              <div className="text-xs text-gray-500">
                {user?.isAdmin ? "Admin" : "Member"}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 transition-colors rounded-full hover:bg-slate-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
