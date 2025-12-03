import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, BookOpen, Heart, MessageSquare } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  // Categories for filtering posts
  const categories = [
    { name: "Home", href: "/", icon: Home, label: "All Posts" },
    { name: "Items", href: "/?category=items", icon: Package, label: "Donations" },
    { name: "Knowledge", href: "/?category=knowledge", icon: BookOpen, label: "Info Sharing" },
    { name: "Support", href: "/?category=emotional-support", icon: Heart, label: "Emotional Support" },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/" && !location.search;
    }
    return location.pathname + location.search === href;
  };

  const isChatActive = location.pathname === "/chat";

  return (
    <aside className="flex flex-col w-64 lg:w-[17rem] border-r border-gray-100 neu-card">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-gray-900">ShareCare</span>
        </Link>
      </div>

      {/* Categories Section */}
      <nav className="flex-1 px-4">
        <div className="mb-3">
          <span className="px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Categories
          </span>
        </div>
        <div className="space-y-1">
          {categories.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "neu-pressed text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${active ? "text-primary-500" : ""}`} />
                <div className="flex flex-col">
                  <span className="text-sm">{item.name}</span>
                  {item.label && <span className="text-xs text-gray-400">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Messages Section - Separated from categories */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="mb-3">
            <span className="px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Communication
            </span>
          </div>
          <Link
            to="/chat"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
              isChatActive
                ? "neu-pressed text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className={`w-5 h-5 mr-3 ${isChatActive ? "text-primary-500" : ""}`} />
            <div className="flex flex-col">
              <span className="text-sm">Messages</span>
              <span className="text-xs text-gray-400">Real-time Chat</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 space-y-2 border-t border-gray-100">
        <div className="px-4 py-2 text-xs text-gray-400">© 2025 ShareCare</div>
      </div>
    </aside>
  );
}
