import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { User, Settings, LogOut, PenSquare } from "lucide-react";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Controls the visual opacity/transform
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Handle Open/Close with Animation delay
  const toggleDropdown = () => {
    if (isOpen) {
      // Start exit animation
      setIsVisible(false);
      // Wait for animation to finish before removing from DOM
      timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    } else {
      // Mount immediately
      setIsOpen(true);
      // Trigger enter animation in next frame
      requestAnimationFrame(() => setIsVisible(true));
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          setIsVisible(false);
          timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: Avatar */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center overflow-hidden transition-all border-2 border-transparent rounded-full size-12 hover:border-cyan-200 focus:outline-none"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-sm font-bold text-white bg-gradient-to-br from-blue-400 to-indigo-500">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`
            absolute right-0 z-50 w-72 mt-3 origin-top-right bg-white shadow-xl rounded-3xl ring-1 ring-black ring-opacity-5
            transition-all duration-200 ease-out
            ${
              isVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2"
            }
          `}
        >
          {/* User Info Section */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-full bg-slate-100">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-lg font-bold text-slate-400">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {user.username || "Unknown User"}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <span className="text-[10px] font-medium uppercase bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                    ID
                  </span>
                  <span className="truncate font-mono text-[11px]">
                    {user.id || "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-between gap-6 px-2 text-center">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user.totalLikes || 0}
                </div>
                <div className="text-xs text-gray-400">Likes</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">0</div>
                <div className="text-xs text-gray-400">Following</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">0</div>
                <div className="text-xs text-gray-400">Followers</div>
              </div>
            </div>
          </div>

          <div className="h-px mx-4 bg-gray-100" />

          {/* Menu Items */}
          <div className="p-2 py-3 space-y-1">
            <Link
              to="/profile"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors group"
              onClick={toggleDropdown}
            >
              <User className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
              My Profile
            </Link>

            <Link
              to="/posts/new"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors group"
              onClick={toggleDropdown}
            >
              <PenSquare className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
              Creation Center
            </Link>

            <Link
              to="/settings"
              className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors group"
              onClick={toggleDropdown}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
              Settings
            </Link>
          </div>

          <div className="h-px mx-4 bg-gray-100" />

          {/* Logout */}
          <div className="p-2 py-3">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
